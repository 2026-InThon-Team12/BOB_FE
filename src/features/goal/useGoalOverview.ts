/** 목표 카드 (홈·목표 탭 공용): 게이지, 참은 금액, 하루 저축액, 예상 달성일 */
import { useMemo, useEffect } from 'react';

import { policy } from '@/config/policy';
import { useActiveGoal, useImpulses, useItems, useBudgets, useExpenses, useToday, refreshGoalAchievements } from '@/data';
import { goalProgress, type GoalProgress } from '@/lib/calc';
import { fundingPlan } from '@/lib/calc/funding';
import type { Goal } from '@/types';

export type GoalOverview =
  | { goal: undefined }
  | {
      goal: Goal;
      progress: GoalProgress;
      /** 일평균 저축액 (가계부가 없으면 null) */
      dailySaving: number | null;
      /** 예상 달성일 날짜 키 (저축액을 모르면 null) */
      eta: string | null;
      usesPreviousBudget: boolean;
    };

export function useGoalOverview(): GoalOverview {
  const goal = useActiveGoal();
  const impulses = useImpulses();
  const items = useItems();
  const today = useToday();
  const budgets = useBudgets();
  const expenses = useExpenses();
  useEffect(() => { refreshGoalAchievements(); }, [today, goal?.id, budgets, expenses]);

  return useMemo(() => {
    if (!goal) return { goal: undefined };
    const progress = goalProgress({ goal, impulses, items, policy, budgets, expenses, today });
    const plan = goal.funding ? fundingPlan(goal, budgets, expenses, today) : null;
    return { goal, progress, dailySaving: plan?.dailySaving ?? null, eta: plan?.eta ?? null, usesPreviousBudget: plan?.usesPreviousBudget ?? false };
  }, [goal, impulses, items, budgets, expenses, today]);
}
