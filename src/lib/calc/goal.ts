/** 기능 4: 목표 비교 */
import type { Policy } from '@/config/policy';
import type { Expense, Goal, ImpulseEvent, Item, MonthlyBudget } from '@/types';
import { addDays, dateKeyOf, diffDays, daysInMonth } from '@/lib/date';
import { fundingPlan } from './funding';
import { discretionaryLimit } from './budget';

/** 일평균 저축액. 직접 입력값이 있으면 우선, 없으면 가계부 월 저축액 ÷ daysPerMonth */
export function dailySaving(params: {
  budget: MonthlyBudget | undefined;
  override: number | null;
  policy: Pick<Policy, 'dailySaving'>;
  remaining?: number;
  today?: string;
}): number | null {
  const { budget, today } = params;
  if (!budget) return null;
  const available = params.remaining ?? discretionaryLimit(budget);
  const days = daysInMonth(today?.slice(0, 7) ?? budget.month) - (today ? Number(today.slice(8)) - 1 : 0);
  return available > 0 ? available / days : null;
}

/** "이거 사면 목표가 N일 늦게 와요" = ceil(지출액 ÷ 일평균 저축액). 저축액을 모르면 null */
export const delayDays = (amount: number, saving: number | null) =>
  saving && saving > 0 && amount > 0 ? Math.max(1, Math.ceil(amount / saving)) : null;

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
  budgets?: Record<string, MonthlyBudget>;
  expenses?: Expense[];
  today?: string;
}): GoalProgress {
  const { goal, impulses, items, policy } = params;
  if (goal.funding) return fundingPlan(goal, params.budgets ?? {}, params.expenses ?? [], params.today ?? goal.funding.startsOn);
  const saved = goalCredits(goal, impulses, items, policy.abandonCountsAsResisted).reduce((sum, row) => sum + row.amount, 0);
  const ratio = goal.price > 0 ? Math.min(1, saved / goal.price) : 1;
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
  const credits = goalCredits(goal,impulses,items,policy.abandonCountsAsResisted);
  const events = credits.map(row=>({amount:row.amount,label: row.sourceId.startsWith('impulse:') ? impulses.find(e=>`impulse:${e.id}`===row.sourceId)?.label ?? goal.name : items.find(i=>`item:${i.id}`===row.sourceId)?.name ?? goal.name}));
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

/** Allocations reference original events; removing an event cancels all its allocations. */
export function goalCredits(goal: Goal, impulses: ImpulseEvent[], items: Item[], includeAbandoned = true): {sourceId: string; amount: number}[] {
  const sources = new Map<string, number>([
    ...impulses.filter(e => e.decision === 'resisted' && !e.cancelledAt).map(e => [`impulse:${e.id}`, e.amount] as const),
    ...items.filter(i => i.status === 'abandoned').map(i => [`item:${i.id}`, i.price] as const),
  ]);
  const credits = (goal.allocations ?? (goal.carriedAmount && !goal.funding ? [{sourceId: `legacy:${goal.id}`, amount: goal.carriedAmount}] : []))
    .map(row => ({...row, amount: Math.min(row.amount, row.sourceId.startsWith('legacy:') ? row.amount : sources.get(row.sourceId) ?? 0)}));
  if (!goal.closedAt) {
    for (const e of impulses) if (e.goalId === goal.id && e.decision === 'resisted' && !e.cancelledAt && !credits.some(r => r.sourceId === `impulse:${e.id}`)) credits.push({sourceId: `impulse:${e.id}`, amount: e.amount});
    if (includeAbandoned) for (const i of items) {
      const belongs = i.savingGoalId ? i.savingGoalId === goal.id : i.decidedAt && i.decidedAt >= goal.createdAt && (!goal.achievedAt || i.decidedAt <= goal.achievedAt);
      if (i.status === 'abandoned' && belongs && !credits.some(r => r.sourceId === `item:${i.id}`)) credits.push({sourceId: `item:${i.id}`, amount: i.price});
    }
  }
  return credits.filter(r => r.amount > 0);
}
