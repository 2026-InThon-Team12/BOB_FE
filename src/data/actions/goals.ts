/** 목표 (기능 4). 활성 목표는 항상 하나 */
import { goalCredits } from '@/lib/calc/goal';
import { fundingPlan, newFunding } from '@/lib/calc/funding';
import { createId } from '@/lib/id';
import type { Goal } from '@/types';

import { getNowIso, getToday } from '../clock';
import { DataError } from '../errors';
import { getState, update } from '../store';

const deactivateAll = (goals: Record<string, Goal>) =>
  Object.fromEntries(Object.entries(goals).map(([id, g]) => [id, g.isActive ? { ...g, isActive: false } : g]));

const validate = (name: string | undefined, price: number | undefined) => {
  if (name !== undefined && !name.trim()) throw new DataError('목표 이름이 비어 있어요.', 'invalid_input');
  if (price !== undefined && (!Number.isInteger(price) || price <= 0)) {
    throw new DataError('목표 금액이 올바르지 않아요.', 'invalid_input');
  }
};

/** 새 목표를 만들고 활성 목표로 지정한다 */
export function createGoal(input: { name: string; price: number; imageUri?: string; productUrl?: string; carriedAmount?: number }): Goal {
  validate(input.name, input.price);
  refreshGoalAchievements();
  const state = getState();
  const today = getToday();
  const previous = Object.values(state.goals).find(g => g.isActive);
  const expenses = Object.values(state.expenses);
  const previousPlan = previous?.funding ? fundingPlan(previous, state.budgets, expenses, today) : null;
  const carried = previous?.achievedAt ? 0 : Math.max(0, Math.min(input.price, previousPlan?.saved ?? 0, Math.round(input.carriedAmount ?? 0)));
  const reserved = previousPlan?.allocationMonth === today.slice(0, 7) ? previousPlan.monthAllocated : 0;
  const goal: Goal = {
    id: createId('gl_'),
    name: input.name.trim(),
    price: input.price,
    imageUri: input.imageUri,
    productUrl: input.productUrl?.trim() || undefined,
    isActive: true,
    funding: newFunding(today, expenses, carried, reserved),
    createdAt: getNowIso(),
    ...(carried > 0 ? { carriedAmount: carried } : {}),
  };
  update((s) => ({ goals: { ...deactivateAll(s.goals), ...(previous ? {[previous.id]: {...previous, isActive: false, closedAt: getNowIso(), allocations: goalCredits(previous, Object.values(s.impulses), Object.values(s.items)), ...(previous.funding && previousPlan && !previous.achievedAt ? {funding: {...previous.funding, frozenBalance: previousPlan.saved - carried, frozenAllocated: reserved, frozenOn: today}} : {})}} : {}), [goal.id]: goal } }));
  refreshGoalAchievements();
  return goal;
}

export function updateGoal(id: string, patch: Partial<Pick<Goal, 'name' | 'price' | 'imageUri' | 'productUrl'>>): Goal {
  const goal = getState().goals[id];
  if (!goal) throw new DataError(`목표를 찾을 수 없어요: ${id}`, 'not_found');
  validate(patch.name, patch.price);
  const next = {
    ...goal,
    ...patch,
    name: patch.name?.trim() ?? goal.name,
    ...(patch.productUrl !== undefined ? { productUrl: patch.productUrl.trim() || undefined } : {}),
  };
  update((s) => ({ goals: { ...s.goals, [id]: next } }));
  refreshGoalAchievements();
  return getState().goals[id];
}

export function setActiveGoal(id: string): void {
  if (!getState().goals[id]) throw new DataError(`목표를 찾을 수 없어요: ${id}`, 'not_found');
  update((s) => ({ goals: { ...deactivateAll(s.goals), [id]: { ...s.goals[id], isActive: true } } }));
}

/** 게이지가 100%가 되면 화면에서 호출한다 (한 번만 기록) */
export function markGoalAchieved(id: string): void {
  const state = getState();
  const goal = state.goals[id];
  if (!goal) throw new DataError(`목표를 찾을 수 없어요: ${id}`, 'not_found');
  if (goal.achievedAt || !goal.funding) return;
  const today = getToday();
  const plan = fundingPlan(goal, state.budgets, Object.values(state.expenses), today);
  if (!plan.achieved) return;
  const on = plan.achievedOn ?? today;
  update((s) => ({ goals: { ...s.goals, [id]: { ...goal, achievedAt: `${on}T12:00:00+09:00`, funding: {...goal.funding!, frozenBalance: plan.saved, frozenAllocated: plan.monthAllocated, frozenOn: on} } } }));
}

export function deleteGoal(id: string): void {
  update((s) => {
    const { [id]: _removed, ...goals } = s.goals;
    return { goals };
  });
}

export function refreshGoalAchievements(): void {
  const s = getState();
  for (const goal of Object.values(s.goals)) if (goal.isActive && !goal.achievedAt) {
    if (!goal.funding) update(current => ({goals: {...current.goals, [goal.id]: {...goal, funding: newFunding(getToday(), Object.values(s.expenses))}}}));
    markGoalAchieved(goal.id);
  }
}
