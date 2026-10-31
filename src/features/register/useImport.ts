/** 장바구니 스크린샷 인식 · 링크 불러오기 (원격 AI 호출 → 초안) */
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { ai } from '@/ai';
import { pickImage, type PickedImage } from '@/lib/image';

import { draftFromAi, emptyDraft, useAddFlow } from './AddFlowContext';

export type ImportResult = 'done' | 'canceled' | 'failed';

export function useScreenshotImport() {
  const flow = useAddFlow();
  const [image, setImage] = useState<PickedImage | null>(null);
  const mutation = useMutation({ mutationFn: (img: PickedImage) => ai.parseCartScreenshot(img) });

  /** 사진을 고르고 인식까지. 품목을 하나라도 찾으면 'done' */
  const pickAndAnalyze = async (): Promise<ImportResult> => {
    const picked = await pickImage();
    if (!picked) return 'canceled';
    setImage(picked);
    try {
      const drafts = await mutation.mutateAsync(picked);
      if (drafts.length === 0) return 'failed';
      flow.setRows(drafts.map(draftFromAi));
      return 'done';
    } catch {
      return 'failed';
    }
  };

  return {
    image,
    analyzing: mutation.isPending,
    failed: mutation.isError || (mutation.isSuccess && mutation.data.length === 0),
    empty: mutation.isSuccess && mutation.data.length === 0,
    pickAndAnalyze,
  };
}

const isUrl = (text: string) => /^https?:\/\/\S+\.\S+/i.test(text.trim());

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
      flow.setRows([draftFromAi(await mutation.mutateAsync(url.trim()))]);
      return 'done';
    } catch {
      flow.setRows([{ ...emptyDraft('link'), sourceUrl: url.trim() }]);
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
  return () => flow.setRows([emptyDraft('manual')]);
}
