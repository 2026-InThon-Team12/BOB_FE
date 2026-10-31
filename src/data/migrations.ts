/**
 * 저장 데이터 스키마 버전과 마이그레이션.
 *
 * 데이터 구조(schema.ts / types)를 바꾸면:
 *   1. CURRENT_VERSION을 1 올린다.
 *   2. MIGRATIONS[이전 버전]에 이전 → 새 구조 변환 함수를 추가한다.
 *   3. __tests__/migrations.test.ts에 이전 버전 샘플을 추가한다.
 */

export const CURRENT_VERSION = 1;

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** key: 이 버전에서 다음 버전으로 올리는 함수 */
const MIGRATIONS: Record<number, Migration> = {
  // 예) 1: (s) => ({ ...s, newField: [] }),
};

export class MigrationError extends Error {}

export function migrate(persisted: unknown, fromVersion: number): unknown {
  if (fromVersion > CURRENT_VERSION) {
    throw new MigrationError(`저장 데이터 버전(${fromVersion})이 앱(${CURRENT_VERSION})보다 높아요.`);
  }
  let state = persisted as Record<string, unknown>;
  for (let v = fromVersion; v < CURRENT_VERSION; v += 1) {
    const step = MIGRATIONS[v];
    if (!step) throw new MigrationError(`버전 ${v} → ${v + 1} 마이그레이션이 없어요.`);
    state = step(state);
  }
  return state;
}
