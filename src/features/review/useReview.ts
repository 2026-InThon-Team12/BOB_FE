/** 구매 후 점검 (기능 2, 시안 "구매 후 점검") — 사용 구간을 고르면 예측과 비교 */
import { useMemo } from 'react';

import { policy } from '@/config/policy';
import { useItem, useToday } from '@/data';
import { derivePhase, predictionVerdict, reviewDueDay, VERDICT_RATIO } from '@/lib/calc';
import { dateKeyOf, diffDays } from '@/lib/date';

export function useReview(itemId: string | undefined) {
  const item = useItem(itemId);
  const today = useToday();
  const bucketId = item?.review?.usageBucket ?? null;

  const view = useMemo(() => {
    if (!item || !item.purchase) return null;
    const window = policy.reviewAfterDays;
    // 시뮬레이션이 끝난 뒤의 결과 → today를 충분히 뒤로
    const predictedRate = item.summary?.expectedDays !== null && item.summary?.expectedDays !== undefined ? item.summary.expectedDays / 30 : 0;
    const eligible = !!item.summary?.eligible && dateKeyOf(item.purchase.boughtAt) >= (item.simulation.endDate ?? dateKeyOf(item.simulation.startAt));
    const bucket = policy.reviewUsageBuckets.find((b) => b.id === bucketId) ?? null;
    const due = reviewDueDay(item, policy);

    let comparison = null;
    if (bucket && eligible) {
      const actualRate = bucket.usedDays / window;
      const ratio = actualRate > 0 ? predictedRate / actualRate : predictedRate > 0 ? Infinity : 1;
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
      eligible,
    };
  }, [item, today, bucketId]);

  return {
    view,
    bucketId,
    saved: !!item?.review,
  };
}
