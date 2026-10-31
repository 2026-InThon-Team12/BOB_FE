/**
 * 데모 시나리오 데이터. 오늘을 기준으로 여러 단계의 물품과 기록을 만든다.
 * (dev 화면의 "시나리오 시드"에서 사용)
 */
import { policy } from '@/config/policy';
import { defaultQuestionTemplates } from '@/constants/questionTemplates';
import { bucketForCategory, buildQuestions, simulationDays } from '@/lib/calc';
import { dateKeyOf, toMonthKey } from '@/lib/date';
import { createId } from '@/lib/id';
import type { CategoryId, DailyAnswer, Expense, Goal, ImpulseEvent, Item, Question, ReasonId } from '@/types';

import { createInitialState, type DataState } from './schema';
import { replaceState } from './store';

type ItemSpec = {
  name: string;
  price: number;
  category: CategoryId;
  reasons: ReasonId[];
  /** 시뮬레이션 시작일 (오늘 기준 일수, 음수 = 과거) */
  start: number;
  /** 시뮬레이션 날짜별 사용 여부 (앞에서부터 답한 날) */
  used: boolean[];
  status: Item['status'];
  decided?: number;
  /** "7일 보류"로 연장된 일수 */
  held?: number;
  /** 구매 후 점검: policy.reviewUsageBuckets의 id */
  review?: { usageBucket: string; at: number };
};

export function buildDemoState(now: Date): DataState {
  const at = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  };

  const state = createInitialState();
  state.settings = { ...state.settings, onboarded: true };

  // 가계부 (이번 달)
  const month = toMonthKey(now);
  state.budgets[month] = { month, income: 2_500_000, food: 400_000, living: 600_000, transport: 100_000, saving: 500_000 };

  // 목표
  const goal: Goal = { id: createId('gl_'), name: '미쿠 피규어', price: 280_000, isActive: true, createdAt: at(-20) };
  state.goals[goal.id] = goal;

  // 진열장: 이미 이룬 목표들 (참은 기록 포함)
  const achieved: { name: string; price: number; start: number; end: number; resisted: [string, number][] }[] = [
    { name: '블루투스 스피커', price: 129_000, start: -75, end: -45, resisted: [['배달 음식', 18_000], ['배달 음식', 21_000], ['커피', 4_800], ['배달 음식', 85_200]] },
    { name: '러닝화', price: 99_000, start: -110, end: -80, resisted: [['편의점 간식', 9_000], ['커피', 90_000]] },
    { name: '겨울 패딩', price: 219_000, start: -330, end: -280, resisted: [['배달 음식', 119_000], ['택시', 100_000]] },
  ];
  for (const g of achieved) {
    const done: Goal = {
      id: createId('gl_'),
      name: g.name,
      price: g.price,
      isActive: false,
      createdAt: at(g.start),
      achievedAt: at(g.end),
    };
    state.goals[done.id] = done;
    g.resisted.forEach(([label, amount], i) => {
      const e: ImpulseEvent = { id: createId('im_'), goalId: done.id, label, amount, decision: 'resisted', at: at(g.start + 1 + i) };
      state.impulses[e.id] = e;
    });
  }

  const specs: ItemSpec[] = [
    // 진행 중 (디지털: 과대예측 경향 → 재질문 강조 대상)
    { name: '무선 이어폰', price: 189_000, category: 'digital', reasons: ['sns_ad'], start: -5, used: [true, false, true, false, false], status: 'simulating' },
    // 오늘 시작
    { name: '캠핑 의자', price: 45_000, category: 'hobby', reasons: ['stress'], start: 0, used: [], status: 'simulating' },
    // 결정 대기 (7일 끝남)
    { name: '니트 가디건', price: 59_000, category: 'clothing', reasons: ['discount_limited'], start: -7, used: [false, true, false, false, true, false, false], status: 'simulating' },
    // 보류 → 7일 연장되어 다시 시뮬레이션 중 (10일째 / 14일)
    { name: '전동 칫솔', price: 89_000, category: 'appliance', reasons: ['need'], start: -10, used: [true, true, false, true, true, true, false, true, false, true], status: 'simulating', held: policy.holdDays },
    // 포기 (목표 게이지에 반영)
    { name: '한정판 운동화', price: 139_000, category: 'clothing', reasons: ['discount_limited', 'sns_ad'], start: -24, used: Array(14).fill(false).map((_, i) => i % 5 === 0), status: 'abandoned', decided: -10 },
    { name: '립 틴트 3종 세트', price: 36_000, category: 'beauty', reasons: ['discount_limited', 'bundle_discount'], start: -18, used: [false, false, true, false, false, false, false], status: 'abandoned', decided: -11 },
    // 구매 → 점검 대기
    { name: '스마트워치', price: 250_000, category: 'digital', reasons: ['peer'], start: -30, used: [true, true, true, false, true, true, true, false, true, true, true, true, false, true], status: 'bought', decided: -15 },
    // 구매 → 점검 완료 (리포트·재질문 강조용 과거 기록)
    { name: '태블릿 거치대', price: 32_000, category: 'digital', reasons: ['sns_ad'], start: -45, used: [true, true, true, true, false, true, true], status: 'bought', decided: -38, review: { usageBucket: 'sometimes', at: -24 } },
    { name: '블루투스 키보드', price: 79_000, category: 'digital', reasons: ['need'], start: -60, used: [true, true, false, true, true, true, false], status: 'bought', decided: -53, review: { usageBucket: 'sometimes', at: -39 } },
    { name: '요가 매트', price: 28_000, category: 'hobby', reasons: ['long_wanted'], start: -50, used: [true, false, true], status: 'bought', decided: -47, review: { usageBucket: 'often', at: -33 } },
  ];

  for (const spec of specs) {
    const id = createId('it_');
    const startAt = at(spec.start);
    const item: Item = {
      id,
      name: spec.name,
      price: spec.price,
      category: spec.category,
      reasons: spec.reasons,
      source: 'manual',
      status: spec.status,
      ...(spec.review ? {summary:{text:'데모: 구매 전 사용일수 예측',method:'DEMO',expectedDays:spec.category==='digital' ? 25 : 15,coverage:1,eligible:true,reason:null,fingerprint:'demo'}} : {}),
      createdAt: startAt,
      simulation: { startAt, durationDays: simulationDays(spec.price, policy.simulationBands) + (spec.held ?? 0) },
      ...(spec.decided !== undefined ? { decidedAt: at(spec.decided) } : {}),
      ...(spec.status === 'bought' && spec.decided !== undefined ? { purchase: { boughtAt: at(spec.decided) } } : {}),
      ...(spec.review
        ? {
            review: {
              usageBucket: spec.review.usageBucket,
              usedDays: policy.reviewUsageBuckets.find((b) => b.id === spec.review!.usageBucket)!.usedDays,
              at: at(spec.review.at),
            },
          }
        : {}),
    };
    state.items[id] = item;

    const questions: Question[] = buildQuestions({
      itemId: id,
      templates: defaultQuestionTemplates(spec.category),
      fallbackTemplates: [],
      createId: () => createId('q_'),
    });
    for (const q of questions) state.questions[q.id] = q;
    const normal = questions.filter((q) => q.variant === 'normal');

    spec.used.slice(0, item.simulation.durationDays).forEach((used, i) => {
      const q = normal[i % normal.length];
      const option = q.options.find((o) => o.countsAsUse === used) ?? q.options[0];
      const answer: DailyAnswer = {
        id: createId('an_'),
        itemId: id,
        date: dateKeyOf(at(spec.start + i)),
        questionId: q.id,
        optionId: option.id,
        at: at(spec.start + i),
      };
      state.answers[answer.id] = answer;
    });

    if (spec.status === 'bought' && item.purchase) {
      const expense: Expense = {
        id: createId('ex_'),
        amount: item.price,
        bucket: bucketForCategory(item.category, policy),
        label: item.name,
        source: 'item',
        refId: id,
        at: item.purchase.boughtAt,
      };
      state.expenses[expense.id] = expense;
    }
  }

  // 참기 기록
  const impulses: Omit<ImpulseEvent, 'id'>[] = [
    { goalId: goal.id, label: '치킨', amount: 23_000, decision: 'resisted', at: at(-6) },
    { goalId: goal.id, label: '카페', amount: 6_500, decision: 'resisted', at: at(-2) },
    { goalId: goal.id, label: '야식 떡볶이', amount: 15_000, decision: 'spent', at: at(-1) },
  ];
  for (const e of impulses) {
    const event: ImpulseEvent = { ...e, id: createId('im_') };
    state.impulses[event.id] = event;
    if (event.decision === 'spent') {
      const expense: Expense = {
        id: createId('ex_'),
        amount: event.amount,
        bucket: policy.defaultBucket,
        label: event.label,
        source: 'impulse',
        refId: event.id,
        at: event.at,
      };
      state.expenses[expense.id] = expense;
    }
  }

  // 앱 밖 소비
  const manual: Expense = {
    id: createId('ex_'),
    amount: 10_000,
    bucket: 'discretionary',
    label: '인형뽑기',
    source: 'manual',
    at: at(-3),
  };
  state.expenses[manual.id] = manual;

  return state;
}

/** 현재 데이터를 데모 시나리오로 바꾼다 (시간 이동은 초기화) */
export function loadDemoSeed(): void {
  replaceState(buildDemoState(new Date()));
}
