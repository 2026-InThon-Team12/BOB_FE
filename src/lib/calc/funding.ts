/** Calendar-based estimated saving. No resisted/abandoned amount is money. */
import type { Expense, Goal, MonthlyBudget } from '@/types';
import { addDays, dateKeyOf, daysInMonth } from '@/lib/date';
import { discretionaryLimit, latestBudget } from './budget';

export const isFreeExpense = (e: Expense) => e.bucket === 'discretionary' || e.source !== 'manual';
export const freeSpentThrough = (expenses: Expense[], on: string) => expenses
  .filter(e => isFreeExpense(e) && dateKeyOf(e.at).slice(0, 7) === on.slice(0, 7) && dateKeyOf(e.at) <= on)
  .reduce((sum, e) => sum + e.amount, 0);

export function newFunding(today: string, expenses: Expense[], openingBalance = 0, reservedThisMonth = 0): NonNullable<Goal['funding']> {
  return { startsOn: today, openingBalance, baselineSpent: freeSpentThrough(expenses, today), reservedThisMonth };
}

export type FundingPlan = {
  saved: number; ratio: number; achieved: boolean; remaining: number;
  dailySaving: number | null; eta: string | null; achievedOn: string | null;
  monthAllocated: number; allocationMonth: string; usesPreviousBudget: boolean;
};

export function fundingPlan(goal: Goal, budgets: Record<string, MonthlyBudget>, expenses: Expense[], today: string, extraSpending = 0): FundingPlan {
  const f = goal.funding;
  if (!f) throw new Error('Goal funding must be migrated before calculating');
  const end = f.frozenOn && f.frozenOn < today ? f.frozenOn : today;
  let saved = f.openingBalance, pool = 0, allocated = f.reservedThisMonth;
  let month = '', achievedOn: string | null = null, usesPreviousBudget = false;
  const spending = new Map<string, number>();
  for (const expense of expenses) if (isFreeExpense(expense)) {
    const on = dateKeyOf(expense.at);
    spending.set(on, (spending.get(on) ?? 0) + expense.amount);
  }
  const firstMonth = f.startsOn.slice(0, 7);
  const beforeStart = freeSpentThrough(expenses, f.startsOn) - (spending.get(f.startsOn) ?? 0);
  const spend = (amount: number) => {
    pool -= amount;
    if (pool < 0) {
      const debit = Math.min(saved, -pool);
      saved -= debit; allocated = Math.max(0, allocated - debit); pool = 0;
    }
  };
  for (let day = f.startsOn; day <= end; day = addDays(day, 1)) {
    const currentMonth = day.slice(0, 7);
    if (currentMonth !== month) {
      month = currentMonth;
      const budget = latestBudget(budgets, month);
      usesPreviousBudget ||= !!budget && !budgets[month];
      allocated = month === firstMonth ? f.reservedThisMonth : 0;
      pool = Math.max(0, (budget ? discretionaryLimit(budget) : 0)
        - (month === firstMonth ? f.baselineSpent + f.reservedThisMonth : 0));
    }
    spend((spending.get(day) ?? 0) + (day === f.startsOn ? beforeStart - f.baselineSpent : 0));
    if (day === today) spend(extraSpending);
    if (day < today && !f.frozenOn) {
      const credit = Math.floor(pool / (daysInMonth(month) - Number(day.slice(8)) + 1));
      pool -= credit; saved += credit; allocated += credit;
      if (saved >= goal.price) { achievedOn = day; break; }
    }
  }
  if (f.frozenBalance !== undefined) saved = f.frozenBalance;
  if (f.frozenAllocated !== undefined) allocated = f.frozenAllocated;
  const remaining = Math.max(0, goal.price - saved);
  let eta = remaining === 0 ? (goal.achievedAt ? dateKeyOf(goal.achievedAt) : achievedOn ?? today) : null;
  const currentBudget = latestBudget(budgets, today.slice(0, 7));
  const daily = currentBudget && pool > 0 && !goal.achievedAt
    ? pool / (daysInMonth(today.slice(0, 7)) - Number(today.slice(8)) + 1) : null;
  // Forecast month by month. Future months repeat the most recent entered plan.
  let left = remaining, cursor = today, capacity = pool;
  for (let i = 0; left > 0 && i < 1200; i++) {
    const m = cursor.slice(0, 7), days = daysInMonth(m) - Number(cursor.slice(8)) + 1;
    if (capacity >= left && capacity > 0) {
      // Simulate integer KRW rounding only within the final month.
      for (let d = 0; d < days; d++) {
        const credit = Math.floor(capacity / (days - d));
        capacity -= credit; left -= credit;
        if (left <= 0) { eta = addDays(cursor, d); break; }
      }
      break;
    }
    left -= capacity;
    cursor = addDays(cursor, days);
    const b = latestBudget(budgets, cursor.slice(0, 7));
    if (!b || discretionaryLimit(b) <= 0) break;
    usesPreviousBudget ||= !budgets[cursor.slice(0, 7)];
    capacity = Math.max(0, discretionaryLimit(b));
  }
  return { saved, remaining, ratio: Math.min(1, saved / goal.price), achieved: remaining === 0,
    dailySaving: daily, eta, achievedOn, monthAllocated: allocated, allocationMonth: month,
    usesPreviousBudget };
}
