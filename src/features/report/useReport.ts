/** 리포트 탭 (기능 2·6, 시안 "리포트") */
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { policy } from '@/config/policy';
import { CATEGORY_LABELS } from '@/constants/categories';
import { REASON_SHORT_LABELS } from '@/constants/reasons';
import { syncRemoteItems, useAnswers, useExpenses, useImpulses, useItems, useQuestions, useThisMonth } from '@/data';
import { monthlyOutsideSpending } from '@/lib/calc/outsideSpending';
import { monthlySummary, reasonStats, tendencyBadge, VERDICT_RATIO } from '@/lib/calc';
import { categoryReviewUsage } from '@/lib/calc/tendency';
import { addMonths } from '@/lib/date';

export function useReport() {
  useFocusEffect(useCallback(() => { void syncRemoteItems().catch(() => {}); }, []));
  const thisMonth = useThisMonth();
  const [picked, setPicked] = useState<string | null>(null);
  const month = picked ?? thisMonth;

  const items = useItems();
  const questions = useQuestions();
  const answers = useAnswers();
  const impulses = useImpulses();
  const expenses = useExpenses();

  const data = useMemo(() => {
    // 예측 vs 실제 · 이유별 포기율은 표본이 적어서 지금까지 기록 전체로 본다
    const tendencies = categoryReviewUsage({ items, questions, answers, policy })
      .slice()
      .sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1));
    const scale = Math.max(1, ...tendencies.flatMap((t) => [t.predictedDays ?? 0, t.actualDays]));
    const compare = tendencies.map((t) => ({
      category: t.category,
      label: CATEGORY_LABELS[t.category],
      predictedDays: t.predictedDays,
      actualDays: t.actualDays,
      minDays: t.minDays,
      maxDays: t.maxDays,
      samples: t.samples,
      predictionWindowDays:t.predictionWindowDays,
      actualWindowDays:t.actualWindowDays,
      predictedRatio: (t.predictedDays ?? 0) / scale,
      actualRatio: t.actualDays / scale,
      badge: t.ratio === null ? null : tendencyBadge(t.ratio),
    }));

    const top = tendencies[0];
    const finding =
      top && top.ratio !== null && top.ratio >= VERDICT_RATIO.muchLess
        ? { label: CATEGORY_LABELS[top.category], ratio: top.ratio }
        : null;

    const reasons = reasonStats(items)
      .filter((r) => r.abandonRate !== null)
      .sort((a, b) => (b.abandonRate ?? 0) - (a.abandonRate ?? 0))
      .map((r) => ({ reason: r.reason, label: REASON_SHORT_LABELS[r.reason], rate: r.abandonRate ?? 0 }));
    const topReason = reasons[0] && reasons[0].rate >= 0.5 ? reasons[0] : null;

    return {
      summary: monthlySummary({ items, impulses, month }),
      outsideSpending: monthlyOutsideSpending(expenses, month),
      finding,
      compare,
      reasons,
      topReason,
      empty: items.length === 0 && impulses.length === 0 && expenses.length === 0,
    };
  }, [items, questions, answers, impulses, expenses, month]);

  return {
    month,
    canNext: month < thisMonth,
    prev: () => setPicked(addMonths(month, -1)),
    next: () => setPicked(month < thisMonth ? addMonths(month, 1) : month),
    ...data,
  };
}
