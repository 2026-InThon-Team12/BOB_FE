/** 참기 기록(기능 4)과 지출 원장·가계부(기능 7) */
import { policy } from '@/config/policy';
import { createId } from '@/lib/id';
import type { BucketId, Expense, ImpulseEvent, MonthlyBudget } from '@/types';
import { MonthlyBudgetSchema } from '@/types';

import { getNowIso } from '../clock';
import { DataError } from '../errors';
import { getState, update } from '../store';

const validAmount = (amount: number) => {
  if (!Number.isInteger(amount) || amount <= 0) throw new DataError('금액이 올바르지 않아요.', 'invalid_input');
};

/**
 * 즉석 개입 결과를 기록한다.
 * - resisted: 활성 목표 게이지에 쌓인다
 * - spent: 지출 원장에도 기록된다 ("그냥 살래요" · "이미 썼어요")
 */
export function recordImpulse(input: {
  label: string;
  amount: number;
  decision: ImpulseEvent['decision'];
  bucket?: BucketId;
}): ImpulseEvent {
  validAmount(input.amount);
  if (!input.label.trim()) throw new DataError('무엇에 쓰려고 했는지 적어 주세요.', 'invalid_input');
  const now = getNowIso();
  const activeGoal = Object.values(getState().goals).find((g) => g.isActive);

  const event: ImpulseEvent = {
    id: createId('im_'),
    goalId: activeGoal?.id,
    label: input.label.trim(),
    amount: input.amount,
    decision: input.decision,
    at: now,
  };
  const expense: Expense | null =
    input.decision === 'spent'
      ? {
          id: createId('ex_'),
          amount: input.amount,
          bucket: input.bucket ?? policy.defaultBucket,
          label: event.label,
          source: 'impulse',
          refId: event.id,
          at: now,
        }
      : null;

  update((s) => ({
    impulses: { ...s.impulses, [event.id]: event },
    ...(expense ? { expenses: { ...s.expenses, [expense.id]: expense } } : {}),
  }));
  return event;
}

export function removeImpulse(id: string): void {
  update((s) => {
    const { [id]: _removed, ...impulses } = s.impulses;
    const expenses = Object.fromEntries(
      Object.entries(s.expenses).filter(([, e]) => !(e.source === 'impulse' && e.refId === id)),
    );
    return { impulses, expenses };
  });
}

/** 직접 입력한 지출 */
export function addExpense(input: { label: string; amount: number; bucket: BucketId; at?: string }): Expense {
  validAmount(input.amount);
  const expense: Expense = {
    id: createId('ex_'),
    amount: input.amount,
    bucket: input.bucket,
    label: input.label.trim() || '지출',
    source: 'manual',
    at: input.at ?? getNowIso(),
  };
  update((s) => ({ expenses: { ...s.expenses, [expense.id]: expense } }));
  return expense;
}

/** 직접 입력한 지출만 지울 수 있다 (물품·참기 지출은 원본을 지우면 함께 지워진다) */
export function removeExpense(id: string): void {
  const expense = getState().expenses[id];
  if (!expense) return;
  if (expense.source !== 'manual') {
    throw new DataError('물품·참기 기록에서 생긴 지출은 원래 기록에서 지워 주세요.', 'invalid_transition');
  }
  update((s) => {
    const { [id]: _removed, ...expenses } = s.expenses;
    return { expenses };
  });
}

export function setMonthlyBudget(budget: MonthlyBudget): MonthlyBudget {
  const parsed = MonthlyBudgetSchema.safeParse(budget);
  if (!parsed.success) throw new DataError('가계부 입력값이 올바르지 않아요.', 'invalid_input');
  update((s) => ({ budgets: { ...s.budgets, [budget.month]: parsed.data } }));
  return parsed.data;
}
