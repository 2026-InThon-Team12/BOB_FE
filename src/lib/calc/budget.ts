/** 기능 7: 작은 가계부 */
import type { Policy } from '@/config/policy';
import type { BucketId, CategoryId, Expense, MonthlyBudget } from '@/types';
import { monthKeyOf } from '@/lib/date';

/** 자유 지출 한도 = 수입 − (식비 + 생활비 + 교통비 + 저축). 음수일 수 있다 */
export const discretionaryLimit = (b: MonthlyBudget) => b.income - b.food - b.living - b.transport - b.saving;

export function bucketLimit(b: MonthlyBudget, bucket: BucketId): number {
  switch (bucket) {
    case 'food':
      return b.food;
    case 'living':
      return b.living;
    case 'transport':
      return b.transport;
    case 'discretionary':
      return discretionaryLimit(b);
  }
}

export const bucketForCategory = (
  category: CategoryId,
  policy: Pick<Policy, 'categoryToBucket' | 'defaultBucket'>,
): BucketId => policy.categoryToBucket[category] ?? policy.defaultBucket;

export const spentInMonth = (expenses: Expense[], bucket: BucketId, month: string) =>
  expenses.filter((e) => e.bucket === bucket && monthKeyOf(e.at) === month).reduce((s, e) => s + e.amount, 0);

export type BucketBalance = { bucket: BucketId; limit: number; spent: number; remaining: number };

export function remainingBudget(params: {
  budget: MonthlyBudget;
  expenses: Expense[];
  bucket: BucketId;
}): BucketBalance {
  const { budget, expenses, bucket } = params;
  const limit = bucketLimit(budget, bucket);
  const spent = spentInMonth(expenses, bucket, budget.month);
  return { bucket, limit, spent, remaining: limit - spent };
}

/** 해당 월 가계부, 없으면 그 이전 가장 최근 달의 가계부 (새 달의 기본값·일평균 저축액 계산용) */
export function latestBudget(budgets: Record<string, MonthlyBudget>, month: string): MonthlyBudget | undefined {
  if (budgets[month]) return budgets[month];
  const prev = Object.keys(budgets)
    .filter((m) => m < month)
    .sort()
    .pop();
  return prev ? budgets[prev] : undefined;
}
