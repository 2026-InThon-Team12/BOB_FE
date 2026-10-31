/** 목표 진열장 (명세서 4.9) · 목표 달성 (4.10) */
import { useMemo } from 'react';

import { policy } from '@/config/policy';
import { useGoals, useImpulses, useItems, useToday } from '@/data';
import { goalProgress, goalStats, type GoalStats } from '@/lib/calc';
import { dateKeyOf } from '@/lib/date';
import type { Goal } from '@/types';

export type ShelfSlot =
  | { kind: 'active'; goal: Goal; ratio: number }
  | { kind: 'achieved'; goal: Goal; achievedOn: string; stats: GoalStats }
  | { kind: 'next' };

const PER_SHELF = 3;
const MIN_SHELVES = 3;

export function useGoalShelf() {
  const goals = useGoals();
  const impulses = useImpulses();
  const items = useItems();
  const today = useToday();

  return useMemo(() => {
    const achieved = goals
      .filter((g) => g.achievedAt)
      .sort((a, b) => b.achievedAt!.localeCompare(a.achievedAt!))
      .map<ShelfSlot>((goal) => ({
        kind: 'achieved',
        goal,
        achievedOn: dateKeyOf(goal.achievedAt!),
        stats: goalStats({ goal, impulses, items, today, policy }),
      }));
    const active = goals
      .filter((g) => g.isActive && !g.achievedAt)
      .map<ShelfSlot>((goal) => ({ kind: 'active', goal, ratio: goalProgress({ goal, impulses, items, policy }).ratio }));
    const slots: ShelfSlot[] = [...active, ...achieved, { kind: 'next' }];
    const shelfCount = Math.max(MIN_SHELVES, Math.ceil(slots.length / PER_SHELF));
    const shelves = Array.from({ length: shelfCount }, (_, i) => slots.slice(i * PER_SHELF, i * PER_SHELF + PER_SHELF));

    return {
      shelves,
      achievedCount: achieved.length,
      achievedTotal: achieved.reduce((s, a) => s + (a.kind === 'achieved' ? a.goal.price : 0), 0),
    };
  }, [goals, impulses, items, today]);
}

/** 목표 달성 화면용 (id가 없으면 가장 최근 달성 목표) */
export function useAchievedGoal(id: string | undefined) {
  const goals = useGoals();
  const impulses = useImpulses();
  const items = useItems();
  const today = useToday();
  return useMemo(() => {
    const goal = id ? goals.find((g) => g.id === id) : goals.filter((g) => g.achievedAt).sort((a, b) => b.achievedAt!.localeCompare(a.achievedAt!))[0];
    if (!goal) return null;
    return { goal, stats: goalStats({ goal, impulses, items, today, policy }) };
  }, [goals, impulses, items, today, id]);
}
