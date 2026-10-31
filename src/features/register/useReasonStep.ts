/**
 * 등록한 물품마다 구매 이유 고르기 (기능 6, 명세서 4.4) + 자유 소비 잔액 리마인드 (기능 7)
 * - 할인·한정 판매 → 마감일, 기타 → 직접 입력
 * - 마지막 품목: 묶음 중 하나라도 "일정 금액 이상 담으면 추가 할인" 이유가 있으면 할인 함정 확인으로
 */
import { useMemo, useState } from 'react';

import { policy } from '@/config/policy';
import { registerAfterReasons, updateItem, useBudget, useExpenses, useItem, useItems, useThisMonth, useToday } from '@/data';
import { bucketForCategory, remainingBudget } from '@/lib/calc';
import type { ReasonId } from '@/types';

import { useAddFlow } from './AddFlowContext';

type Draft = { reasons: ReasonId[]; otherText: string; saleEndsAt?: string };

export function useReasonStep() {
  const { createdIds, registrationKey } = useAddFlow();
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [registering, setRegistering] = useState(false);
  const today = useToday();

  const id = createdIds[index];
  const item = useItem(id);
  const allItems = useItems();
  const budget = useBudget(useThisMonth());
  const expenses = useExpenses();

  const balance = useMemo(() => {
    if (!item || !budget) return null;
    const bucket = bucketForCategory(item.category, policy);
    const b = remainingBudget({ budget, expenses, bucket });
    return { ...b, afterPurchase: b.remaining - item.price };
  }, [item, budget, expenses]);

  const draftOf = (key: string | undefined): Draft => {
    const saved = allItems.find((i) => i.id === key);
    return (key && drafts[key]) || {
      reasons: saved?.reasons ?? [],
      otherText: saved?.reasonOtherText ?? '',
      saleEndsAt: saved?.saleEndsAt,
    };
  };
  const draft = draftOf(id);
  const patch = (p: Partial<Draft>) => id && setDrafts((d) => ({ ...d, [id]: { ...draftOf(id), ...p } }));

  const isLast = index >= createdIds.length - 1;

  // 묶음 전체에서 "추가 할인" 이유를 고른 물건 (지금 보고 있는 품목은 아직 저장 전이라 초안 기준)
  const trapNames = createdIds
    .filter((cid) => draftOf(cid).reasons.includes('bundle_discount'))
    .map((cid) => allItems.find((i) => i.id === cid)?.name)
    .filter((n): n is string => !!n);

  const save = () => {
    if (!item) return undefined;
    return updateItem(item.id, {
      reasons: draft.reasons,
      reasonOtherText: draft.reasons.includes('other') ? draft.otherText.trim() || undefined : undefined,
      saleEndsAt: draft.reasons.includes('discount_limited') ? draft.saleEndsAt : undefined,
    });
  };

  return {
    item,
    position: { current: index + 1, total: createdIds.length },
    reasons: draft.reasons,
    toggle: (reason: ReasonId) =>
      patch({ reasons: draft.reasons.includes(reason) ? draft.reasons.filter((r) => r !== reason) : [...draft.reasons, reason] }),
    otherText: draft.otherText,
    setOtherText: (otherText: string) => patch({ otherText }),
    saleEndsAt: draft.saleEndsAt,
    setSaleEndsAt: (saleEndsAt: string) => patch({ saleEndsAt }),
    today,
    balance,
    notifyTime: policy.dailyNotifyTime,
    isLast,
    /** 마지막 품목에서 할인 함정 확인으로 갈지 */
    trapNames: isLast ? trapNames : [],
    batchId: item?.batchId,
    registrationKey,
    createdCount: createdIds.length,
    /** 현재 품목 저장 후 다음 품목으로. 마지막이면 'done' */
    registering,
    next: async (): Promise<'next' | 'done' | 'discount' | 'failed'> => {
      const saved = save();
      if (!saved) return 'failed';
      if (isLast) {
        const confirmed = createdIds
          .map((createdId) => (createdId === saved.id ? saved : allItems.find((candidate) => candidate.id === createdId)))
          .filter((candidate): candidate is NonNullable<typeof candidate> => !!candidate);
        if (confirmed.length !== createdIds.length) return 'failed';
        setRegistering(true);
        try {
          return await registerAfterReasons(confirmed, registrationKey);
        } catch (error) {
          console.warn('[register] items/batch 실패', error);
          return 'failed';
        } finally {
          setRegistering(false);
        }
      }
      setIndex((i) => i + 1);
      return 'next';
    },
    /** 등록 흐름 밖에서 바로 들어온 경우 (보여줄 물품 없음) */
    empty: createdIds.length === 0,
  };
}
