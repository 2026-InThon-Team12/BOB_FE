/** 장바구니 스크린샷 인식 · 링크 불러오기 (원격 AI 호출 → 초안) */
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { ai } from '@/ai';
import { copy } from '@/constants/copy';
import { orderedBatch } from '@/lib/orderedBatch';
import { pickCartImages, prepareCartImage, type PickedImage } from '@/lib/image';

import { draftFromAi, emptyDraft, useAddFlow } from './AddFlowContext';

export type ImportResult = 'done' | 'canceled' | 'failed';

type ScanSlot = {image: PickedImage; status: 'pending' | 'done' | 'failed'; rows: ReturnType<typeof draftFromAi>[]; error?: unknown};
export function useScreenshotImport() {
  const flow = useAddFlow();
  const slotsRef = useRef<ScanSlot[]>([]);
  const running = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {mounted.current = true; return () => {mounted.current = false;};}, []);
  const [slots, setSlots] = useState<ScanSlot[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [pickError, setPickError] = useState<unknown>(null);
  const run = async (indices: number[]) => {
    if (running.current) return;
    running.current = true; setAnalyzing(true);
    for (const index of indices) slotsRef.current[index] = {...slotsRef.current[index], status: 'pending', error: undefined};
    setSlots([...slotsRef.current]);
    try {
      await orderedBatch(indices, async index => {
        const analysis = await ai.parseCartScreenshot(await prepareCartImage(slotsRef.current[index].image));
        if (!analysis.items.length) throw new Error(copy.register.analyzeEmpty);
        return analysis.items.map(draftFromAi);
      }, (position, result) => {
        if (!mounted.current) return;
        const index = indices[position];
        slotsRef.current[index] = {...slotsRef.current[index], ...(result.status === 'fulfilled'
          ? {status: 'done' as const, rows: result.value, error: undefined}
          : {status: 'failed' as const, rows: [], error: result.reason})};
        setSlots([...slotsRef.current]);
        flow.setRows(slotsRef.current.flatMap(slot => slot.rows));
      });
    } finally {running.current = false;if (mounted.current) setAnalyzing(false);}
  };
  const pickAndAnalyze = async (): Promise<ImportResult> => {
    if (running.current) return 'canceled';
    setPickError(null);
    let picked: PickedImage[] | null;
    try { picked = await pickCartImages(); }
    catch (error) {setPickError(error);return 'failed';}
    if (!mounted.current || !picked?.length) return 'canceled';
    slotsRef.current = picked.map(image => ({image, status:'pending', rows:[]}));
    setSlots([...slotsRef.current]); flow.setRows([]);
    await run(picked.map((_, i) => i));
    return slotsRef.current.some(s => s.status === 'done') ? 'done' : 'failed';
  };
  return {
    slots, analyzing, pickAndAnalyze,
    retryFailed: () => run(slotsRef.current.flatMap((s,i) => s.status === 'failed' ? [i] : [])),
    completed: slots.filter(s => s.status !== 'pending').length,
    hasRows: slots.some(s => s.rows.length > 0),
    failed: !!pickError || slots.some(s => s.status === 'failed'),
    errorMessage: copy.register.imageError(pickError ?? slots.find(s => s.error)?.error),
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
