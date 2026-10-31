/**
 * 목표 정하기 (명세서 4.8-1): GoalSetup(바꿀 때) · GoalSetupFirst(처음)
 * BoB는 저금 앱이 아니라 저축액·저축 목표는 받지 않는다. 게이지는 참아서 아낀 돈으로만 채워진다.
 */
import { useMemo, useState } from 'react';

import { policy } from '@/config/policy';
import { createGoal, useItems, useToday } from '@/data';
import { derivePhase, goalSetupPreview } from '@/lib/calc';
import { pickImage, toThumbnail } from '@/lib/image';

import { useGoalOverview } from './useGoalOverview';

export type GoalSetupMode = 'change' | 'first';

const MAX_PICKS = 6;

export function useGoalSetup(requested: GoalSetupMode | undefined) {
  const overview = useGoalOverview();
  const items = useItems();
  const today = useToday();

  // 달성 전인 활성 목표가 있으면 "바꿀 때", 아니면 "처음"
  const current = overview.goal && !overview.progress.achieved ? overview : null;
  const mode: GoalSetupMode = requested ?? (current ? 'change' : 'first');
  const currentSaved = mode === 'change' && current?.goal ? current.progress.saved : 0;

  const [transfer, setTransfer] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [productUrl, setProductUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [photoLoading, setPhotoLoading] = useState(false);

  /** "등록한 물건에서 고르기" — 지금 고민 중인 물건 */
  const registered = useMemo(
    () =>
      items
        .filter((i) => {
          const phase = derivePhase(i, today, policy);
          return phase === 'simulating' || phase === 'awaitingDecision';
        })
        .slice(0, MAX_PICKS),
    [items, today],
  );

  const ready = name.trim().length > 0 && !!price && price > 0;
  const preview = ready
    ? goalSetupPreview({ price: price!, currentSaved, transfer: mode === 'change' && transfer })
    : null;

  return {
    mode,
    current: mode === 'change' && current?.goal ? { goal: current.goal, saved: currentSaved } : null,
    transfer,
    setTransfer,
    name,
    setName,
    price,
    setPrice,
    productUrl,
    setProductUrl,
    imageUri,
    photoLoading,
    pickPhoto: async () => {
      const picked = await pickImage();
      if (!picked) return;
      setPhotoLoading(true);
      try {
        setImageUri(await toThumbnail(picked));
      } catch (e) {
        console.warn('[goal] 사진 변환 실패', e);
      } finally {
        setPhotoLoading(false);
      }
    },
    removePhoto: () => setImageUri(undefined),
    registered,
    /** 등록한 물건을 고르면 이름·가격·상품 링크(·사진) 자동 입력 */
    pickRegistered: (id: string) => {
      const item = registered.find((i) => i.id === id);
      if (!item) return;
      setName(item.name);
      setPrice(item.price);
      setProductUrl(item.sourceUrl ?? '');
      if (item.imageUri) setImageUri(item.imageUri);
    },
    ready,
    preview,
    submit: (): boolean => {
      if (!ready) return false;
      createGoal({ name, price: price!, productUrl, imageUri, carriedAmount: preview?.carried ?? 0 });
      return true;
    },
  };
}
