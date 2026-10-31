/**
 * 로컬 데이터 스토어 (내부 모듈).
 * 앱 코드는 이 파일을 직접 쓰지 않고 @/data(index)의 selector 훅과 action만 쓴다.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CURRENT_VERSION, migrate } from './migrations';
import { createInitialState, DataStateSchema, type DataState } from './schema';
import { persistStorage, quarantine, STORAGE_KEY } from './storage';

/** 저장된 값을 검증한다. 실패하면 원본을 보관하고 초기 상태로 시작한다 */
function mergePersisted(persisted: unknown, current: DataState): DataState {
  if (persisted === undefined || persisted === null) return current;
  const parsed = DataStateSchema.safeParse(persisted);
  if (parsed.success) return parsed.data;
  console.warn('[data] 저장 데이터 검증 실패 — 초기 상태로 시작합니다.', parsed.error.issues.slice(0, 5));
  void quarantine(persisted);
  return current;
}

export const useDataStore = create<DataState>()(
  persist(createInitialState, {
    name: STORAGE_KEY,
    storage: persistStorage,
    version: CURRENT_VERSION,
    migrate: (persisted, version) => {
      try {
        return migrate(persisted, version) as DataState;
      } catch (e) {
        // 마이그레이션 실패: 원본을 보관하고 초기 상태로 시작한다 (merge에서 undefined → 초기 상태)
        console.warn('[data] 마이그레이션 실패', e);
        void quarantine(persisted);
        return undefined as unknown as DataState;
      }
    },
    merge: (persisted, current) => mergePersisted(persisted, current),
  }),
);

export const getState = () => useDataStore.getState();

/** 여러 데이터를 함께 바꾸는 작업도 한 번의 set으로 처리한다 (중간 불일치 방지) */
export const update = (recipe: (draft: DataState) => Partial<DataState>) =>
  useDataStore.setState((s) => recipe(s));

export const replaceState = (next: DataState) => useDataStore.setState(next, true);
