/** 장바구니 스크린샷 인식 · 링크 불러오기 (원격 AI 호출 → 초안) */
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { ai } from '@/ai';
import { copy } from '@/constants/copy';
import { pickImage, prepareCartImage, type PickedImage } from '@/lib/image';

import { draftFromAi, emptyDraft, useAddFlow } from './AddFlowContext';

export type ImportResult = 'done' | 'canceled' | 'failed';

export function useScreenshotImport() {
  const flow = useAddFlow();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [pickError, setPickError] = useState<Error | null>(null);
  const mutation = useMutation({ mutationFn: async (img: PickedImage) =>
    ai.parseCartScreenshot(await prepareCartImage(img)) });

  /** 사진을 고르고 인식까지. 품목을 하나라도 찾으면 'done' */
  const pickAndAnalyze = async (): Promise<ImportResult> => {
    setPickError(null);
    mutation.reset();
    let picked: PickedImage | null;
    try {
      picked = await pickImage();
    } catch {
      setPickError(new Error(copy.register.imageUnreadable));
      return 'failed';
    }
    if (!picked) return 'canceled';
    // 기존 초안은 유지하고, 새 사진 분석에 성공한 항목만 추가한다.
    setImage(picked);
    try {
      const analysis = await mutation.mutateAsync(picked);
      if (analysis.items.length === 0) return 'failed';
      flow.appendRows(analysis.items.map(draftFromAi));
      return 'done';
    } catch {
      return 'failed';
    }
  };

  return {
    image,
    analyzing: mutation.isPending,
    failed: !!pickError || mutation.isError || (mutation.isSuccess && mutation.data.items.length === 0),
    errorMessage: copy.register.imageError(pickError ?? mutation.error),
    empty: mutation.isSuccess && mutation.data.items.length === 0,
    warnings: mutation.data?.warnings ?? [],
    analysisMethod: mutation.data?.analysisMethod,
    pickAndAnalyze,
  };
}

// 백엔드 ProductUrlInput 계약은 HTTPS URL만 허용한다.
const isUrl = (text: string) => /^https:\/\/\S+\.\S+/i.test(text.trim());

export function useLinkImport() {
  const flow = useAddFlow();
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mutation = useMutation({ mutationFn: (u: string) => ai.parseLink(u) });

  /** 성공하면 'done', 실패하면 링크만 남긴 빈 초안으로 'failed' (직접 입력으로 이어감) */
  const fetchLink = async (): Promise<ImportResult> => {
    setSubmitted(true);
    if (!isUrl(url)) return 'canceled';
    try {
      flow.appendRows([draftFromAi(await mutation.mutateAsync(url.trim()))]);
      return 'done';
    } catch {
      flow.appendRows([{ ...emptyDraft('link'), sourceUrl: url.trim() }]);
      return 'failed';
    }
  };

  return {
    url,
    setUrl,
    invalid: submitted && !isUrl(url),
    loading: mutation.isPending,
    fetchLink,
  };
}

/** 직접 입력: 빈 초안 한 줄로 시작 */
export function useStartManual() {
  const flow = useAddFlow();
  return () => flow.appendRows([emptyDraft('manual')]);
}
