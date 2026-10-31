/** 기능 4: 목표 비교 */
import type { Policy } from '@/config/policy';
import type { Goal, ImpulseEvent, Item, MonthlyBudget } from '@/types';
import { addDays, dateKeyOf, diffDays } from '@/lib/date';

/** 일평균 저축액. 직접 입력값이 있으면 우선, 없으면 가계부 월 저축액 ÷ daysPerMonth */
export function dailySaving(params: {
  budget: MonthlyBudget | undefined;
  override: number | null;
  policy: Pick<Policy, 'dailySaving'>;
}): number | null {
  const { budget, override, policy } = params;
  if (override !== null && override > 0) return override;
  if (!budget || budget.saving <= 0) return null;
  return budget.saving / policy.dailySaving.daysPerMonth;
}

/** "이거 사면 목표가 N일 늦게 와요" = max(1, round(지출액 ÷ 일평균 저축액)) (명세서 5장). 저축액을 모르면 null */
export const delayDays = (amount: number, saving: number | null) =>
  saving && saving > 0 && amount > 0 ? Math.max(1, Math.round(amount / saving)) : null;

export type GoalProgress = {
  saved: number;
  /** 0 ~ 1 (넘으면 1) */
  ratio: number;
  achieved: boolean;
  remaining: number;
};

/**
 * 참은 금액 누적.
 * - 이 목표에 연결된 '참았어요' 기록
 * - 정책상 허용되면, 목표를 만든 뒤(달성 전) 포기한 물품 금액
 */
export function goalProgress(params: {
  goal: Goal;
  impulses: ImpulseEvent[];
  items: Item[];
  policy: Pick<Policy, 'abandonCountsAsResisted'>;
}): GoalProgress {
  const { goal, impulses, items, policy } = params;
  const inGoalPeriod = (iso: string | undefined) =>
    !!iso && iso >= goal.createdAt && (!goal.achievedAt || iso <= goal.achievedAt);

  const fromImpulses = impulses
    .filter((e) => e.goalId === goal.id && e.decision === 'resisted')
    .reduce((s, e) => s + e.amount, 0);

  const fromAbandoned = policy.abandonCountsAsResisted
    ? items.filter((i) => i.status === 'abandoned' && inGoalPeriod(i.decidedAt)).reduce((s, i) => s + i.price, 0)
    : 0;

  // 참은 금액 = min(목표 금액, 옮겨 온 금액 + 누적) (명세서 5장 · 4.8-1)
  const saved = Math.min(goal.price, (goal.carriedAmount ?? 0) + fromImpulses + fromAbandoned);
  const ratio = goal.price > 0 ? saved / goal.price : 1;
  return { saved, ratio, achieved: saved >= goal.price, remaining: Math.max(0, goal.price - saved) };
}

/** 예상 달성일 = 오늘 + ceil(남은 금액 ÷ 일평균 저축액). 이미 달성했으면 오늘, 저축액을 모르면 null */
export function expectedAchieveDate(remaining: number, saving: number | null, today: string): string | null {
  if (remaining <= 0) return today;
  if (!saving || saving <= 0) return null;
  return addDays(today, Math.ceil(remaining / saving));
}

export type GoalStats = {
  /** 참은 횟수 (참았어요 + 목표 기간 중 Bye 한 물건) */
  resistedCount: number;
  /** 목표를 정한 날부터 달성(또는 오늘)까지 */
  daysTaken: number;
  /** 가장 많이 참은 것 (횟수, 같으면 금액) */
  topLabel: string | null;
};

/** 목표 달성 화면·진열장 상세 통계 (시안: 참은 횟수 27번 · 걸린 기간 48일 · 가장 많이 참은 것) */
export function goalStats(params: {
  goal: Goal;
  impulses: ImpulseEvent[];
  items: Item[];
  today: string;
  policy: Pick<Policy, 'abandonCountsAsResisted'>;
}): GoalStats {
  const { goal, impulses, items, today, policy } = params;
  const inPeriod = (iso: string | undefined) =>
    !!iso && iso >= goal.createdAt && (!goal.achievedAt || iso <= goal.achievedAt);
  const events = [
    ...impulses
      .filter((e) => e.goalId === goal.id && e.decision === 'resisted')
      .map((e) => ({ label: e.label, amount: e.amount })),
    ...(policy.abandonCountsAsResisted
      ? items.filter((i) => i.status === 'abandoned' && inPeriod(i.decidedAt)).map((i) => ({ label: i.name, amount: i.price }))
      : []),
  ];
  const byLabel = new Map<string, { count: number; amount: number }>();
  for (const e of events) {
    const cur = byLabel.get(e.label) ?? { count: 0, amount: 0 };
    byLabel.set(e.label, { count: cur.count + 1, amount: cur.amount + e.amount });
  }
  const top = [...byLabel.entries()].sort((a, b) => b[1].count - a[1].count || b[1].amount - a[1].amount)[0];
  const end = goal.achievedAt ? dateKeyOf(goal.achievedAt) : today;
  return {
    resistedCount: events.length,
    daysTaken: Math.max(1, diffDays(dateKeyOf(goal.createdAt), end)),
    topLabel: top ? top[0] : null,
  };
}

/** 목표 정하기 미리보기 (명세서 4.8-1): 옮긴 금액 = 바꿀 때 && 스위치 ? min(모은 돈, 가격) : 0 */
export function goalSetupPreview(params: { price: number; currentSaved: number; transfer: boolean }) {
  const { price, currentSaved, transfer } = params;
  const carried = transfer ? Math.min(currentSaved, price) : 0;
  return { carried, remaining: Math.max(0, price - carried), ratio: price > 0 ? carried / price : 0 };
}
