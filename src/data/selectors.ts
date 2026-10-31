/**
 * 화면·뷰모델에서 쓰는 조회 훅.
 * 레코드를 배열로 바꾸는 작업은 useMemo로 감싸 매 렌더마다 새 배열이 생기지 않게 한다.
 */
import { useMemo, useSyncExternalStore } from 'react';

import { latestBudget } from '@/lib/calc';
import type { Item } from '@/types';

import { useDataStore } from './store';

const byCreatedDesc = (a: Item, b: Item) => b.createdAt.localeCompare(a.createdAt);

/** 저장소에서 데이터를 다 불러왔는지 (불러오기 전에는 화면을 그리지 않는다) */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    useDataStore.persist.onFinishHydration,
    useDataStore.persist.hasHydrated,
    useDataStore.persist.hasHydrated,
  );
}

export function useItems(): Item[] {
  const items = useDataStore((s) => s.items);
  return useMemo(() => Object.values(items).filter((i) => i.registrationState !== 'pending').sort(byCreatedDesc), [items]);
}

export function useRegistrationItems(): Item[] {
  const items = useDataStore((s) => s.items);
  return useMemo(() => Object.values(items).sort(byCreatedDesc), [items]);
}

export const useItem = (id: string | undefined) => useDataStore((s) => (id ? s.items[id] : undefined));

export function useQuestions() {
  const questions = useDataStore((s) => s.questions);
  return useMemo(() => Object.values(questions), [questions]);
}

export function useItemQuestions(itemId: string | undefined) {
  const questions = useDataStore((s) => s.questions);
  return useMemo(() => Object.values(questions).filter((q) => q.itemId === itemId), [questions, itemId]);
}

export function useAnswers() {
  const answers = useDataStore((s) => s.answers);
  return useMemo(() => Object.values(answers), [answers]);
}

export function useGoals() {
  const goals = useDataStore((s) => s.goals);
  return useMemo(() => Object.values(goals).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [goals]);
}

export function useActiveGoal() {
  const goals = useDataStore((s) => s.goals);
  return useMemo(() => Object.values(goals).find((g) => g.isActive), [goals]);
}

export function useImpulses() {
  const impulses = useDataStore((s) => s.impulses);
  return useMemo(() => Object.values(impulses).filter(e=>!e.cancelledAt).sort((a, b) => b.at.localeCompare(a.at)), [impulses]);
}

export function useExpenses() {
  const expenses = useDataStore((s) => s.expenses);
  return useMemo(() => Object.values(expenses).sort((a, b) => b.at.localeCompare(a.at)), [expenses]);
}

export const useBudget = (month: string) => useDataStore((s) => s.budgets[month]);

/** 해당 월 가계부가 없으면 가장 최근 달의 가계부 */
export function useLatestBudget(month: string) {
  const budgets = useDataStore((s) => s.budgets);
  return useMemo(() => latestBudget(budgets, month), [budgets, month]);
}

export const useSettings = () => useDataStore((s) => s.settings);
