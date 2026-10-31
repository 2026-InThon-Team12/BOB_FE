/** 목표 탭 즉석 개입 (기능 4, 명세서 4.8) — 지금 사려는 것 → 목표 지연 일수 → 참을까요? */
import { useEffect, useState } from 'react';

import { policy } from '@/config/policy';
import { markGoalAchieved, recordImpulse } from '@/data';
import { delayDays } from '@/lib/calc';
import { addDays } from '@/lib/date';

import { useGoalOverview } from './useGoalOverview';

export type ImpulseOutcome = { kind: 'resisted'; amount: number; reached: boolean } | { kind: 'spent' };

export function useImpulse() {
  const overview = useGoalOverview();
  const [picked, setPicked] = useState<number | 'custom'>(1);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  // Bye 등으로 100%가 됐는데 아직 달성 기록이 없으면 남긴다
  const goal = overview.goal;
  const achievedNow = !!goal && overview.progress.achieved && !goal.achievedAt;
  useEffect(() => {
    if (achievedNow && goal) markGoalAchieved(goal.id);
  }, [achievedNow, goal]);

  const preset = picked === 'custom' ? null : policy.impulsePresets[picked];
  const label = preset ? preset.label : customName.trim();
  const amount = preset ? preset.amount : (customAmount ?? 0);
  const ready = label.length > 0 && amount > 0;

  const saving = overview.goal ? overview.dailySaving : null;
  const delay = ready ? delayDays(amount, saving) : null;
  const eta = overview.goal ? overview.eta : null;

  return {
    overview,
    presets: policy.impulsePresets,
    picked,
    pick: setPicked,
    customName,
    setCustomName,
    customAmount,
    setCustomAmount,
    label,
    amount,
    ready,
    dailySaving: saving,
    delay,
    /** 참으면 / 사면 예상 달성일 */
    etaIfResist: eta,
    etaIfBuy: eta && delay ? addDays(eta, delay) : null,
    resist: (): ImpulseOutcome | null => {
      if (!ready || !overview.goal) return null;
      recordImpulse({ label, amount, decision: 'resisted' });
      const reached = overview.progress.saved + amount >= overview.goal.price;
      if (reached) markGoalAchieved(overview.goal.id);
      return { kind: 'resisted', amount, reached };
    },
    giveIn: (): ImpulseOutcome | null => {
      if (!ready) return null;
      recordImpulse({ label, amount, decision: 'spent' });
      return { kind: 'spent' };
    },
  };
}
