/** 리포트 탭 (기능 2·6, 시안 "리포트") */
import { useMemo, useState } from 'react';

import { policy } from '@/config/policy';
import { CATEGORY_LABELS } from '@/constants/categories';
import { REASON_SHORT_LABELS } from '@/constants/reasons';
import { useAnswers, useImpulses, useItems, useQuestions, useThisMonth } from '@/data';
import { categoryTendency, monthlySummary, reasonStats, tendencyBadge, VERDICT_RATIO } from '@/lib/calc';
import { addMonths } from '@/lib/date';

export function useReport() {
  const thisMonth = useThisMonth();
  const [picked, setPicked] = useState<string | null>(null);
  const month = picked ?? thisMonth;

  const items = useItems();
  const questions = useQuestions();
  const answers = useAnswers();
  const impulses = useImpulses();

  const data = useMemo(() => {
    // 예측 vs 실제 · 이유별 포기율은 표본이 적어서 지금까지 기록 전체로 본다
    const tendencies = categoryTendency({ items, questions, answers, policy })
      .slice()
      .sort((a, b) => b.ratio - a.ratio);
    const scale = Math.max(1, ...tendencies.flatMap((t) => [t.predictedDays, t.actualDays]));
    const compare = tendencies.map((t) => ({
      category: t.category,
      label: CATEGORY_LABELS[t.category],
      predictedDays: t.predictedDays,
      actualDays: t.actualDays,
      predictedRatio: t.predictedDays / scale,
      actualRatio: t.actualDays / scale,
      badge: tendencyBadge(t.ratio),
    }));

    const top = tendencies[0];
    const finding =
      top && top.ratio >= VERDICT_RATIO.muchLess
        ? { label: CATEGORY_LABELS[top.category], ratio: top.ratio }
        : null;

    const reasons = reasonStats(items)
      .filter((r) => r.abandonRate !== null)
      .sort((a, b) => (b.abandonRate ?? 0) - (a.abandonRate ?? 0))
      .map((r) => ({ reason: r.reason, label: REASON_SHORT_LABELS[r.reason], rate: r.abandonRate ?? 0 }));
    const topReason = reasons[0] && reasons[0].rate >= 0.5 ? reasons[0] : null;

    return {
      summary: monthlySummary({ items, impulses, month }),
      finding,
      compare,
      reasons,
      topReason,
      empty: items.length === 0,
    };
  }, [items, questions, answers, impulses, month]);

  return {
    month,
    canNext: month < thisMonth,
    prev: () => setPicked(addMonths(month, -1)),
    next: () => setPicked(month < thisMonth ? addMonths(month, 1) : month),
    ...data,
  };
}
