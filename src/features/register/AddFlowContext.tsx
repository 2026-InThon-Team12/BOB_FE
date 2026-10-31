/**
 * 물품 등록 흐름(기능 3·6) 공용 상태.
 * 방법 선택 → (스크린샷 인식 | 링크 | 직접 입력) → 확인 → 이유 고르기 화면이 같은 초안을 본다.
 * 저장 전 초안이라 로컬 데이터 스토어에 넣지 않고 흐름이 끝나면 사라진다.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { createId } from '@/lib/id';
import type { CategoryId, ItemDraft, ItemSource } from '@/types';

export type DraftRow = {
  key: string;
  name: string;
  price: number | null;
  category: CategoryId | null;
  /** AI가 고른 카테고리 신뢰도 (사용자가 직접 고르면 지운다) */
  categoryConfidence?: number;
  /** 마지막으로 카테고리 추천을 받은 이름 (같은 이름으로 다시 묻지 않는다) */
  suggestedFor?: string;
  imageUri?: string;
  source: ItemSource;
  sourceUrl?: string;
  /** 체크 해제하면 등록하지 않는다 */
  included: boolean;
};

export const draftFromAi = (d: ItemDraft): DraftRow => ({
  key: createId('dr_'),
  name: d.name,
  price: d.price ?? null,
  category: d.category ?? null,
  categoryConfidence: d.category ? d.categoryConfidence : undefined,
  suggestedFor: d.category ? d.name : undefined,
  imageUri: d.imageUri,
  source: d.source,
  sourceUrl: d.sourceUrl,
  included: true,
});

export const emptyDraft = (source: ItemSource = 'manual'): DraftRow => ({
  key: createId('dr_'),
  name: '',
  price: null,
  category: null,
  source,
  included: true,
});

type AddFlow = {
  rows: DraftRow[];
  setRows: (rows: DraftRow[]) => void;
  updateRow: (key: string, patch: Partial<DraftRow>) => void;
  removeRow: (key: string) => void;
  /** 빈 줄을 추가하고 그 key를 돌려준다 */
  addRow: () => string;
  /** 등록을 마친 물품 id (이유 고르기 단계에서 사용) */
  createdIds: string[];
  setCreatedIds: (ids: string[]) => void;
  /** /items/batch 재시도에도 같은 값을 쓰는 멱등성 키 */
  registrationKey: string;
};

const Ctx = createContext<AddFlow | null>(null);

export function AddFlowProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);
  const [registrationKey] = useState(() => createId('reg_'));

  const value = useMemo<AddFlow>(
    () => ({
      rows,
      setRows,
      updateRow: (key, patch) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r))),
      removeRow: (key) => setRows((rs) => rs.filter((r) => r.key !== key)),
      addRow: () => {
        const row = emptyDraft();
        setRows((rs) => [...rs, row]);
        return row.key;
      },
      createdIds,
      setCreatedIds,
      registrationKey,
    }),
    [rows, createdIds, registrationKey],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAddFlow(): AddFlow {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAddFlow는 item/add 흐름 안에서만 쓸 수 있어요.');
  return ctx;
}
