/** 구매 후 점검 (기능 2, 시안 "구매 후 점검") — 사용 구간을 고르면 예측과 비교 */
import { useMemo, useState } from 'react';

import { policy } from '@/config/policy';
import { submitReview, useAnswers, useItem, useItemQuestions, useToday } from '@/data';
import { derivePhase, predictionVerdict, reviewDueDay, usageSummary, VERDICT_RATIO } from '@/lib/calc';
import { dateKeyOf, diffDays } from '@/lib/date';

export function useReview(itemId: string | undefined) {
  const item = useItem(itemId);
  const questions = useItemQuestions(itemId);
  const answers = useAnswers();
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const bucketId = picked ?? item?.review?.usageBucket ?? null;

  const view = useMemo(() => {
    if (!item || !item.purchase) return null;
    const window = policy.reviewAfterDays;
    // 시뮬레이션이 끝난 뒤의 결과 → today를 충분히 뒤로
    const summary = usageSummary({ item, questions, answers, today: '9999-12-31' });
    const predictedRate = summary.totalDays > 0 ? summary.usedDays / summary.totalDays : 0;
    const bucket = policy.reviewUsageBuckets.find((b) => b.id === bucketId) ?? null;
    const due = reviewDueDay(item, policy);

    let comparison = null;
    if (bucket) {
      const actualRate = bucket.usedDays / window;
      const ratio = actualRate > 0 ? predictedRate / actualRate : Infinity;
      comparison = {
        actualRate,
        ratio,
        verdict: predictionVerdict(ratio, bucket.usedDays),
        overPredicted: ratio >= VERDICT_RATIO.muchLess,
      };
    }

    return {
      item,
      phase: derivePhase(item, today, policy),
      window,
      daysSinceBought: diffDays(dateKeyOf(item.purchase.boughtAt), today),
      daysUntilDue: due ? Math.max(0, diffDays(today, due)) : 0,
      /** 점검 기간으로 환산한 예측 사용 일수 */
      predictedDays: Math.round(predictedRate * window),
      predictedRate,
      buckets: policy.reviewUsageBuckets,
      bucket,
      comparison,
    };
  }, [item, questions, answers, today, bucketId]);

  return {
    view,
    bucketId,
    /** 고르면 바로 저장 (다시 고르면 고친다) */
    pick: (id: string) => {
      setPicked(id);
      if (item) submitReview(item.id, { usageBucket: id });
    },
    saved: !!item?.review,
  };
}
