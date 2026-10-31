/** 시뮬레이션 결과 + 결정 (시안 "시뮬레이션 결과", 기능 1) */
import { useMemo, useState } from 'react';

import { policy } from '@/config/policy';
import {
  decideItem,
  useActiveGoal,
  useAnswers,
  useImpulses,
  useItem,
  useItemQuestions,
  useItems,
  useToday,
} from '@/data';
import {
  costPerUse,
  countStates,
  dayCells,
  daysLeft,
  derivePhase,
  goalProgress,
  reasonStats,
  reasonWarning,
  summaryNotes,
  usageSummary,
  type DecisionAction,
} from '@/lib/calc';

export type DecisionOutcome =
  | { action: 'buy'; reviewAfterDays: number }
  | { action: 'abandon'; amount: number; goal: { name: string; before: number; after: number } | null }
  | { action: 'hold'; days: number };

export function useSimulationResult(itemId: string | undefined) {
  const item = useItem(itemId);
  const questions = useItemQuestions(itemId);
  const answers = useAnswers();
  const items = useItems();
  const impulses = useImpulses();
  const goal = useActiveGoal();
  const today = useToday();
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  const view = useMemo(() => {
    if (!item) return null;
    const cells = dayCells({ item, questions, answers, today });
    const summary = usageSummary({ item, questions, answers, today });
    return {
      item,
      phase: derivePhase(item, today, policy),
      cells,
      counts: countStates(cells),
      usedDays: summary.usedDays,
      totalDays: summary.totalDays,
      costPerUse: costPerUse(item.price, summary.usedDays),
      notes: summaryNotes(cells),
      warning: reasonWarning(item, reasonStats(items.filter((i) => i.id !== item.id))),
      daysLeft: daysLeft(item, today),
    };
  }, [item, questions, answers, items, today]);

  const decide = (action: DecisionAction): DecisionOutcome | undefined => {
    if (!item) return;
    const before = goal ? goalProgress({ goal, impulses, items, policy }).ratio : 0;
    const next = decideItem(item.id, action);
    let result: DecisionOutcome;
    if (action === 'buy') result = { action, reviewAfterDays: policy.reviewAfterDays };
    else if (action === 'hold') result = { action, days: policy.holdDays };
    else {
      const afterItems = items.map((i) => (i.id === next.id ? next : i));
      result = {
        action,
        amount: item.price,
        goal: goal
          ? { name: goal.name, before, after: goalProgress({ goal, impulses, items: afterItems, policy }).ratio }
          : null,
      };
    }
    setOutcome(result);
    return result;
  };

  return { view, outcome, decide };
}
