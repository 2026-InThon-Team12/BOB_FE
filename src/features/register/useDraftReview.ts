/** 인식 결과 확인·수정 → 등록 (기능 3, 시안 "N개 품목을 찾았어요") */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ai } from '@/ai';
import { policy } from '@/config/policy';
import { addItems } from '@/data';
import { simulationDays } from '@/lib/calc';
import type { CategoryId, ConfirmedItemInput } from '@/types';

import { useAddFlow, type DraftRow } from './AddFlowContext';

const SUGGEST_DELAY_MS = 500;

/** 이름을 입력하면 AI 카테고리 추천 (사용자가 직접 고른 행은 건드리지 않음) */
function useAutoCategory(rows: DraftRow[], updateRow: (key: string, patch: Partial<DraftRow>) => void) {
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    for (const row of rows) {
      const name = row.name.trim();
      const userPicked = row.category !== null && row.categoryConfidence === undefined;
      if (name.length < 2 || userPicked || row.suggestedFor === name) continue;

      clearTimeout(timers.current[row.key]);
      timers.current[row.key] = setTimeout(async () => {
        setPending((p) => ({ ...p, [row.key]: true }));
        try {
          const guess = await ai.classifyCategory({ name, price: row.price ?? undefined });
          updateRow(row.key, { category: guess.category, categoryConfidence: guess.confidence, suggestedFor: name });
        } catch {
          updateRow(row.key, { suggestedFor: name });
        } finally {
          setPending((p) => ({ ...p, [row.key]: false }));
        }
      }, SUGGEST_DELAY_MS);
    }
  }, [rows, updateRow]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);
  return pending;
}

const rowErrors = (r: DraftRow) => ({ name: !r.name.trim(), price: !(r.price && r.price > 0) });

export function useDraftReview() {
  const flow = useAddFlow();
  const { rows, updateRow } = flow;
  const suggesting = useAutoCategory(rows, updateRow);
  // 빈 줄로 시작한 행(직접 입력·품목 추가)은 사용자가 접기 전까지 펼쳐 둔다
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(rows.filter((r) => !r.name && r.price === null).map((r) => r.key)),
  );
  const [submitted, setSubmitted] = useState(false);
  const [registering, setRegistering] = useState(false);

  const included = rows.filter((r) => r.included);

  const view = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        days: r.price && r.price > 0 ? simulationDays(r.price, policy.simulationBands) : null,
        errors: submitted && r.included ? rowErrors(r) : { name: false, price: false },
        suggesting: !!suggesting[r.key],
        aiPicked: r.category !== null && r.categoryConfidence !== undefined,
        expanded: expanded.has(r.key),
      })),
    [rows, submitted, suggesting, expanded],
  );

  /** 등록에 성공하면 만들어진 물품 수, 검증 실패면 0 */
  const register = async (): Promise<number> => {
    setSubmitted(true);
    if (included.length === 0 || included.some((r) => rowErrors(r).name || rowErrors(r).price)) return 0;
    setRegistering(true);
    try {
      const inputs: ConfirmedItemInput[] = await Promise.all(
        included.map(async (r) => {
          // 추천이 오기 전에 등록을 누른 경우 여기서 한 번 더 묻는다 (실패하면 '기타')
          const category: CategoryId =
            r.category ??
            (await ai
              .classifyCategory({ name: r.name.trim(), price: r.price ?? undefined })
              .then((g) => g.category)
              .catch((): CategoryId => 'etc'));
          // 맞춤 질문은 관찰 당일에 생성하고 로컬에 고정한다.
          return {
            name: r.name,
            price: r.price!,
            imageUri: r.imageUri,
            category,
            categoryConfidence: r.categoryConfidence,
            reasons: [],
            source: r.source,
            sourceUrl: r.sourceUrl,
          };
        }),
      );
      const created = addItems(inputs, true);
      flow.setCreatedIds(created.map((i) => i.id));
      return created.length;
    } finally {
      setRegistering(false);
    }
  };

  return {
    rows: view,
    includedCount: included.length,
    fromScreenshot: rows.some((r) => r.source === 'screenshot'),
    toggleExpanded: (key: string) =>
      setExpanded((s) => {
        const next = new Set(s);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }),
    setName: (key: string, name: string) => updateRow(key, { name }),
    setPrice: (key: string, price: number | null) => updateRow(key, { price }),
    setIncluded: (key: string, value: boolean) => updateRow(key, { included: value }),
    /** 사용자가 고른 카테고리 — AI 추천 표시를 지우고 다시 추천하지 않는다 */
    setCategory: (key: string, category: CategoryId) => {
      updateRow(key, { category, categoryConfidence: undefined });
      // 명세서 4.3: 선택 즉시 접힘 (이름·가격을 아직 안 적은 직접 입력 줄은 그대로)
      const row = rows.find((r) => r.key === key);
      if (row?.name.trim() && row.price) {
        setExpanded((s) => {
          const next = new Set(s);
          next.delete(key);
          return next;
        });
      }
    },
    removeRow: flow.removeRow,
    addRow: () => {
      const key = flow.addRow();
      setExpanded((s) => new Set(s).add(key));
    },
    noneSelected: submitted && included.length === 0,
    registering,
    register,
  };
}
