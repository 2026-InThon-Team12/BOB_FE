/** 목표 카드 (홈·목표 탭 공용): 게이지, 참은 금액, 하루 저축액, 예상 달성일 */
import { useMemo } from 'react';

import { policy } from '@/config/policy';
import { useActiveGoal, useImpulses, useItems, useLatestBudget, useSettings, useThisMonth, useToday } from '@/data';
import { dailySaving, expectedAchieveDate, goalProgress, type GoalProgress } from '@/lib/calc';
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
    };

export function useGoalOverview(): GoalOverview {
  const goal = useActiveGoal();
  const impulses = useImpulses();
  const items = useItems();
  const today = useToday();
  const budget = useLatestBudget(useThisMonth());
  const { dailySavingOverride } = useSettings();

  return useMemo(() => {
    if (!goal) return { goal: undefined };
    const progress = goalProgress({ goal, impulses, items, policy });
    const saving = dailySaving({ budget, override: dailySavingOverride, policy });
    return { goal, progress, dailySaving: saving, eta: expectedAchieveDate(progress.remaining, saving, today) };
  }, [goal, impulses, items, budget, dailySavingOverride, today]);
}
