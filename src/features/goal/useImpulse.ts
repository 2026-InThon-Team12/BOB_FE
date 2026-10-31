/** 목표 탭 즉석 개입 (기능 4, 명세서 4.8) — 지금 사려는 것 → 목표 지연 일수 → 참을까요? */
import { useRef, useState } from 'react';

import { policy } from '@/config/policy';
import { useBudgets, useExpenses, useToday, recordImpulse } from '@/data';
import { fundingPlan } from '@/lib/calc/funding';
import { diffDays } from '@/lib/date';

import { useGoalOverview } from './useGoalOverview';

export type ImpulseOutcome = { kind: 'resisted'; amount: number; reached: boolean } | { kind: 'spent' };

export function useImpulse(initial: number | 'custom' = 1) {
  const overview = useGoalOverview();
  const [picked, setPicked] = useState<number | 'custom'>(initial);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  const budgets = useBudgets();
  const expenses = useExpenses();
  const today = useToday();
  const submitted = useRef(false);
  const [recorded, setRecorded] = useState(false);
  const reset = () => { submitted.current = false; setRecorded(false); };
  const preset = picked === 'custom' ? null : policy.impulsePresets[picked];
  const label = preset ? preset.label : customName.trim();
  const amount = preset ? preset.amount : (customAmount ?? 0);
  const ready = label.length > 0 && amount > 0;

  const saving = overview.goal ? overview.dailySaving : null;
  const plan = overview.goal?.funding && ready ? fundingPlan(overview.goal, budgets, expenses, today, amount) : null;
  const delay = plan?.eta && overview.goal && overview.eta ? Math.max(0, diffDays(overview.eta, plan.eta)) : null;
  const eta = overview.goal ? overview.eta : null;

  return {
    overview,
    presets: policy.impulsePresets,
    picked,
    pick: (value: number | 'custom') => {reset();setPicked(value);},
    customName,
    setCustomName: (value: string) => {reset();setCustomName(value);},
    customAmount,
    setCustomAmount: (value: number | null) => {reset();setCustomAmount(value);},
    label,
    amount,
    ready: ready && !recorded,
    recorded,
    workMinutes: Math.ceil(amount / policy.hourlyRate * 60),
    dailySaving: saving,
    delay,
    /** 참으면 / 사면 예상 달성일 */
    etaIfResist: eta,
    etaIfBuy: plan?.eta ?? null,
    resist: (): ImpulseOutcome | null => {
      if (!ready || submitted.current) return null;
      submitted.current = true; setRecorded(true);
      recordImpulse({ label, amount, decision: 'resisted' });
      const reached = false;
      return { kind: 'resisted', amount, reached };
    },
    giveIn: (): ImpulseOutcome | null => {
      if (!ready || submitted.current) return null;
      submitted.current = true; setRecorded(true);
      recordImpulse({ label, amount, decision: 'spent' });
      return { kind: 'spent' };
    },
  };
}
