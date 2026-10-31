/** 목표 (기능 4). 활성 목표는 항상 하나 */
import { policy } from '@/config/policy';
import { goalCredits, goalProgress } from '@/lib/calc/goal';
import { createId } from '@/lib/id';
import type { Goal } from '@/types';

import { getNowIso } from '../clock';
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
  const state = getState();
  const previous = Object.values(state.goals).find(g => g.isActive);
  const credits = previous ? goalCredits(previous, Object.values(state.impulses), Object.values(state.items), policy.abandonCountsAsResisted) : [];
  let remaining = previous?.achievedAt ? 0 : Math.max(0, Math.min(input.price, Math.round(input.carriedAmount ?? 0)));
  const moved: {sourceId: string; amount: number}[] = [];
  const retained = credits.map(row => {
    const amount = Math.min(row.amount, remaining);
    remaining -= amount;
    if (amount) moved.push({...row, amount});
    return {...row, amount: row.amount - amount};
  }).filter(row => row.amount > 0);
  const carried = moved.reduce((sum, row) => sum + row.amount, 0);
  const goal: Goal = {
    id: createId('gl_'),
    name: input.name.trim(),
    price: input.price,
    imageUri: input.imageUri,
    productUrl: input.productUrl?.trim() || undefined,
    isActive: true,
    allocations: moved,
    ...(carried >= input.price ? {achievedAt: getNowIso()} : {}),
    createdAt: getNowIso(),
    ...(carried > 0 ? { carriedAmount: carried } : {}),
  };
  update((s) => ({ goals: { ...deactivateAll(s.goals), ...(previous ? {[previous.id]: {...previous, isActive: false, closedAt: getNowIso(), allocations: retained, carriedAmount: undefined}} : {}), [goal.id]: goal } }));
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
  const goal = getState().goals[id];
  if (!goal) throw new DataError(`목표를 찾을 수 없어요: ${id}`, 'not_found');
  if (goal.achievedAt) return;
  update((s) => ({ goals: { ...s.goals, [id]: { ...goal, achievedAt: getNowIso() } } }));
}

export function deleteGoal(id: string): void {
  update((s) => {
    const { [id]: _removed, ...goals } = s.goals;
    return { goals };
  });
}

export function refreshGoalAchievements(): void {
  const s = getState();
  for (const goal of Object.values(s.goals)) if (goal.isActive && !goal.achievedAt && goalProgress({goal, impulses: Object.values(s.impulses), items: Object.values(s.items), policy}).achieved) markGoalAchieved(goal.id);
}
