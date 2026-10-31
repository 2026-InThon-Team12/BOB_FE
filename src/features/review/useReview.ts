/** 구매 후 점검 (기능 2, 시안 "구매 후 점검") — 사용 구간을 고르면 예측과 비교 */
import { useMemo, useRef, useState } from 'react';

import { policy } from '@/config/policy';
import { submitReviewRemote, useItem, useToday } from '@/data';
import { reflectionCopy } from '@/constants/copy';
import { derivePhase, predictedVsActual, predictionVerdict, reviewDueDay, VERDICT_RATIO } from '@/lib/calc';
import { dateKeyOf, diffDays } from '@/lib/date';

export function useReview(itemId: string | undefined) {
  const item = useItem(itemId);
  const today = useToday();
  const saving = useRef(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const bucketId = item?.review?.usageBucket ?? null;

  const view = useMemo(() => {
    if (!item || !item.purchase) return null;
    const window = policy.reviewAfterDays;
    // 시뮬레이션이 끝난 뒤의 결과 → today를 충분히 뒤로
    const prediction = predictedVsActual({item,questions:[],answers:[],policy});
    const predictedRate = prediction?.predictedRate ?? 0;
    const eligible = !!prediction?.comparable;
    const bucket = [...policy.reviewUsageBuckets,...policy.legacyReviewUsageBuckets].find((b) => b.id === bucketId) ?? null;
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
      predictedDays: prediction?.predictedDays ?? 0,
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
    busy, error,
    submit: async (bucket: string) => {
      if (!itemId || saving.current) return;
      saving.current = true; setBusy(true); setError(null);
      try { await submitReviewRemote(itemId,bucket); }
      catch { setError(reflectionCopy.reviewFailed); }
      finally { saving.current=false;setBusy(false); }
    },
  };
}
