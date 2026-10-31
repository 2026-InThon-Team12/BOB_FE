import { reflectionCopy } from '@/constants/copy';
/** 시뮬레이션 결과 + 결정 (시안 "시뮬레이션 결과", 기능 1) */
import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { simulationEndDay } from '@/lib/calc/itemMachine';
import { policy } from '@/config/policy';
import {
  decideItemRemote,
  summarizeItem,
  useAnswers,
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
  const today = useToday();
  const [busy,setBusy] = useState(false);
  const [decisionError,setError] = useState<string|null>(null);
  const query = useQuery({queryKey:['reflection-summary','swipe-days-v1',itemId,today], enabled: !!item && item.status === 'simulating' && today >= simulationEndDay(item),
    queryFn:async()=>{await summarizeItem(itemId!);return true;},retry:false,staleTime:Infinity});
  const summaryLoading=query.isFetching;
  const error=decisionError ?? (query.isError ? item?.summary ? reflectionCopy.summaryRemoteFailed : reflectionCopy.summaryFailed : null);
  const refresh=()=>{void query.refetch();};
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  const view = useMemo(() => {
    if (!item) return null;
    const cells = dayCells({ item, questions, answers, today });
    const summary = usageSummary({ item, questions, answers, today });
    return {
      item,
      canHold: !item.saleEndsAt || item.saleEndsAt > today,
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

  const decide = async (action: DecisionAction): Promise<DecisionOutcome | undefined> => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
    if (!item) return;
    const next = await decideItemRemote(item.id, action);
    let result: DecisionOutcome;
    if (action === 'buy') result = { action, reviewAfterDays: policy.reviewAfterDays };
    else if (action === 'hold') result = { action, days: next.simulation.durationDays - item.simulation.durationDays };
    else {
      result = {
        action,
        amount: item.price,
        goal: null,
      };
    }
    setOutcome(result);
    return result;
    } catch {setError(reflectionCopy.decisionFailed);return;} finally {setBusy(false);}
  };

  return { view, outcome, decide, busy, error, summaryLoading, refresh };
}
