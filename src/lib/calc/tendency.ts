/** 기능 2: 예측 vs 실제 사용 비교, 분야별 과대예측 경향 */
import type { Policy } from '@/config/policy';
import type { CategoryId, DailyAnswer, Item, Question } from '@/types';

import { simulationEndDay } from './itemMachine';
import { dateKeyOf } from '@/lib/date';
import { reflectionCounts, isSwipeQuestion } from '@/lib/reflection';
import { simulationDayKeys } from './simulation';

export type PredictionComparison = {
  /** 시뮬레이션 사용일 ÷ 시뮬레이션 기간 */
  predictedRate: number;
  /** 점검 사용일 ÷ 점검 기간 */
  actualRate: number;
  /** 예측 ÷ 실제. 실제가 0이고 예측이 0보다 크면 Infinity, 둘 다 0이면 1 */
  ratio: number;
  /** 점검 기간으로 환산한 예측 사용 일수 (리포트 "예측 18일 vs 실제 4일") */
  predictedDays: number;
  /** 점검에서 답한 사용 일수 (구간 대표값) */
  actualDays: number;
  predictionWindowDays: number;
  comparable: boolean;
};

const safeRatio = (predicted: number, actual: number) => {
  if (actual > 0) return predicted / actual;
  return predicted > 0 ? Infinity : 1;
};

/** 점검을 마친 물품 하나의 예측/실제 비교. 점검 전이면 null */
export function predictedVsActual(params: {
  item: Item;
  questions: Question[];
  answers: DailyAnswer[];
  policy: Pick<Policy, 'reviewAfterDays'>;
}): PredictionComparison | null {
  const { item, policy } = params;
  if (!item.review || !item.purchase || dateKeyOf(item.purchase.boughtAt) < simulationEndDay(item)) return null;
  const dates = simulationDayKeys(item);
  const questions = params.questions.filter(q=>q.itemId===item.id && q.phase==='pre' && q.date && dates.includes(q.date));
  const counts = item.summary?.reflectionCounts ?? (questions.some(isSwipeQuestion) ? reflectionCounts(questions,params.answers) : undefined);
  if (counts ? !dates.length || counts.YES+counts.NO+counts.UNSURE === 0 : !item.summary?.eligible || item.summary.expectedDays === null) return null;
  const predictedRate = counts ? counts.YES / dates.length : item.summary!.expectedDays! / (item.summary!.predictionWindowDays ?? 30);
  const predictionWindowDays = counts ? dates.length : policy.reviewAfterDays;
  const actualRate = Math.min(1, item.review.usedDays / policy.reviewAfterDays);
  return {
    predictedRate,
    actualRate,
    ratio: safeRatio(predictedRate, actualRate),
    predictedDays: counts ? counts.YES : predictedRate * policy.reviewAfterDays,
    actualDays: item.review.usedDays,
    predictionWindowDays,
    comparable: predictionWindowDays === policy.reviewAfterDays,
  };
}

export type CategoryTendency = {
  category: CategoryId;
  samples: number;
  predictedRate: number;
  actualRate: number;
  /** 평균 예측 ÷ 평균 실제 */
  ratio: number;
  /** 예측 사용 일수 합 (점검 기간 환산) */
  predictedDays: number;
  /** 실제 사용 일수 합 */
  actualDays: number;
};

/** 분야별 평균. 점검을 마친 물품만 센다 */
export function categoryTendency(params: {
  items: Item[];
  questions: Question[];
  answers: DailyAnswer[];
  policy: Pick<Policy, 'reviewAfterDays'>;
}): CategoryTendency[] {
  const { items, questions, answers, policy } = params;
  const groups = new Map<CategoryId, PredictionComparison[]>();

  for (const item of items) {
    const itemQuestions = questions.filter((q) => q.itemId === item.id);
    const cmp = predictedVsActual({ item, questions: itemQuestions, answers, policy });
    if (!cmp || !cmp.comparable) continue;
    groups.set(item.category, [...(groups.get(item.category) ?? []), cmp]);
  }

  return [...groups.entries()].map(([category, list]) => {
    const avg = (f: (c: PredictionComparison) => number) => list.reduce((s, c) => s + f(c), 0) / list.length;
    const predictedRate = avg((c) => c.predictedRate);
    const actualRate = avg((c) => c.actualRate);
    return {
      category,
      samples: list.length,
      predictedRate,
      actualRate,
      ratio: safeRatio(predictedRate, actualRate),
      predictedDays: list.reduce((s, c) => s + c.predictedDays, 0),
      actualDays: list.reduce((s, c) => s + c.actualDays, 0),
    };
  });
}

/** Include every completed review, even when there is no comparable usage forecast. */
export function categoryReviewUsage(params: {
  items: Item[]; questions: Question[]; answers: DailyAnswer[]; policy: Policy;
}) {
  const groups = new Map<CategoryId, {category:CategoryId; samples:number; predictedDays:number|null; actualDays:number; minDays:number; maxDays:number; predictionWindowDays:number; actualWindowDays:number; comparable:boolean}>();
  for (const item of params.items) {
    if (!item.review || !item.purchase) continue;
    const bucket = [...params.policy.reviewUsageBuckets,...params.policy.legacyReviewUsageBuckets].find(b=>b.id===item.review!.usageBucket);
    const cmp = predictedVsActual({...params,item});
    const group = groups.get(item.category) ?? {category:item.category,samples:0,predictedDays:0,actualDays:0,minDays:0,maxDays:0,predictionWindowDays:0,actualWindowDays:0,comparable:true};
    group.samples++;
    group.predictedDays = cmp && group.predictedDays !== null ? group.predictedDays + cmp.predictedDays : null;
    group.actualDays += item.review.usedDays;
    group.minDays += bucket?.minDays ?? item.review.usedDays;
    group.maxDays += bucket?.maxDays ?? item.review.usedDays;
    group.predictionWindowDays += cmp?.predictionWindowDays ?? 0;
    group.actualWindowDays += params.policy.reviewAfterDays;
    group.comparable = group.comparable && !!cmp?.comparable;
    groups.set(item.category,group);
  }
  return [...groups.values()].map(group=>({...group,ratio:group.predictedDays === null || !group.comparable ? null : safeRatio(group.predictedDays,group.actualDays)}));
}

/** 이 분야에 재질문 강조를 할지 */
export function shouldEmphasize(
  category: CategoryId,
  tendencies: CategoryTendency[],
  emphasis: Policy['emphasis'],
): boolean {
  const t = tendencies.find((x) => x.category === category);
  return !!t && t.samples >= emphasis.minSamples && t.ratio >= emphasis.overPredictionRatio;
}

/** 리포트 문구용: 과대예측이 가장 큰 분야 (기준을 넘는 분야가 없으면 null) */
export function mostOverPredicted(tendencies: CategoryTendency[], emphasis: Policy['emphasis']) {
  const candidates = tendencies.filter(
    (t) => t.samples >= emphasis.minSamples && t.ratio >= emphasis.overPredictionRatio,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (b.ratio > a.ratio || (b.ratio === a.ratio && b.samples > a.samples) ? b : a));
}
