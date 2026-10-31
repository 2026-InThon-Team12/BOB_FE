/** 지갑 탭 — 이번 달 자유 소비 잔액, 돈 계획, 등록 안 하고 쓴 돈 (기능 7) */
import { useMemo } from 'react';

import { removeExpense, useBudget, useExpenses, useThisMonth } from '@/data';
import { discretionaryLimit, remainingBudget } from '@/lib/calc';
import { dateKeyOf, monthKeyOf } from '@/lib/date';

export function useWallet() {
  const month = useThisMonth();
  const budget = useBudget(month);
  const expenses = useExpenses();

  return useMemo(() => {
    const unregistered = expenses
      .filter((e) => e.source === 'manual' && monthKeyOf(e.at) === month)
      .map((e) => ({ id: e.id, label: e.label, amount: e.amount, date: dateKeyOf(e.at) }));

    if (!budget) return { month, budget: undefined, unregistered, removeExpense };

    const balance = remainingBudget({ budget, expenses, bucket: 'discretionary' });
    return {
      month,
      budget,
      free: discretionaryLimit(budget),
      balance,
      /** 자유 소비 중 쓴 비율 (게이지) */
      spentRatio: balance.limit > 0 ? balance.spent / balance.limit : 1,
      unregistered,
      removeExpense,
    };
  }, [month, budget, expenses]);
}
