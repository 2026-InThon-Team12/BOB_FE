/** 이번 달 돈 계획 폼 (온보딩·지갑 공용) — 기능 7 */
import { useMemo, useState } from 'react';

import { policy } from '@/config/policy';
import { useExpenses, useToday, setMonthlyBudget, useLatestBudget, useThisMonth } from '@/data';
import { dailySaving, discretionaryLimit } from '@/lib/calc';
import { freeSpentThrough } from '@/lib/calc/funding';
import type { MonthlyBudget } from '@/types';

export const BUDGET_FIELDS = ['income', 'food', 'living', 'transport', 'saving'] as const;
export type BudgetField = (typeof BUDGET_FIELDS)[number];
type Values = Record<BudgetField, number | null>;

const EMPTY: Values = { income: null, food: null, living: null, transport: null, saving: null };

export function useBudgetForm() {
  const month = useThisMonth();
  const today = useToday();
  const expenses = useExpenses();
  const base = useLatestBudget(month);
  // 이번 달 계획이 없으면 가장 최근 달 값으로 미리 채운다
  const prefilledFrom = base && base.month !== month ? base.month : null;
  const [values, setValues] = useState<Values>(() =>
    base ? { income: base.income, food: base.food, living: base.living, transport: base.transport, saving: base.saving } : EMPTY,
  );
  const [submitted, setSubmitted] = useState(false);

  const budget: MonthlyBudget = useMemo(
    () => ({
      month,
      income: values.income ?? 0,
      food: values.food ?? 0,
      living: values.living ?? 0,
      transport: values.transport ?? 0,
      saving: values.saving ?? 0,
    }),
    [month, values],
  );

  const free = discretionaryLimit(budget);
  const incomeMissing = !values.income;

  const submit = (): boolean => {
    setSubmitted(true);
    if (incomeMissing) return false;
    setMonthlyBudget(budget);
    return true;
  };

  return {
    month,
    values,
    setValue: (field: BudgetField, value: number | null) => setValues((v) => ({ ...v, [field]: value })),
    /** 자유롭게 쓸 수 있는 돈 (음수면 계획이 수입보다 많음) */
    free,
    overBudget: free < 0,
    dailySaving: dailySaving({ budget, override: null, policy, today, remaining: free - freeSpentThrough(expenses, today) }),
    prefilledFrom,
    errors: { income: submitted && incomeMissing },
    submit,
  };
}
