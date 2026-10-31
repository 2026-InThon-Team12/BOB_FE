/** 장바구니 스크린샷 인식 · 링크 불러오기 (원격 AI 호출 → 초안) */
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { ai } from '@/ai';
import { copy } from '@/constants/copy';
import { productUrlFromText } from '@/lib/productUrl';
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
const isUrl = (text: string) => productUrlFromText(text) !== null;

export function useLinkImport() {
  const flow = useAddFlow();
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mutation = useMutation({ mutationFn: (u: string) => ai.parseLink(u) });
  const running = useRef(false);

  /** 실패하면 현재 입력과 기존 초안을 보존한다. 직접 입력은 사용자가 선택한다. */
  const fetchLink = async (): Promise<ImportResult> => {
    setSubmitted(true);
    const normalized = productUrlFromText(url);
    if (!normalized || running.current) return 'canceled';
    running.current = true;
    try {
      flow.setRows([draftFromAi(await mutation.mutateAsync(normalized))]);
      return 'done';
    } catch {
      return 'failed';
    } finally { running.current = false; }
  };

  return {
    url,
    setUrl: (value: string) => { setUrl(value); mutation.reset(); },
    failed: mutation.isError,
    errorMessage: copy.register.linkError(mutation.error),
    startManual: () => flow.setRows([{ ...emptyDraft('link'), sourceUrl: productUrlFromText(url) ?? undefined }]),
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
