/**
 * JSON 백업/복원. 데이터가 기기에만 있으므로 기기 변경·캐시 삭제에 대비한다.
 */
import { z } from 'zod';

import { getNowIso } from './clock';
import { CURRENT_VERSION, migrate, MigrationError } from './migrations';
import { DataStateSchema, type DataState } from './schema';
import { getState, replaceState } from './store';

const BACKUP_APP_ID = 'bob';

const BackupEnvelopeSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  version: z.number().int().positive(),
  exportedAt: z.string(),
  data: z.unknown(),
});

export function exportBackup(state: DataState = getState()): string {
  const envelope = { app: BACKUP_APP_ID, version: CURRENT_VERSION, exportedAt: getNowIso(), data: state };
  return JSON.stringify(envelope, null, 2);
}

export type ImportResult = { ok: true; state: DataState } | { ok: false; reason: string };

/** 백업 문자열을 검증하고 현재 버전으로 변환한다 (저장은 하지 않음) */
export function parseBackup(json: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'JSON 형식이 아니에요.' };
  }
  const envelope = BackupEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return { ok: false, reason: 'BOB 백업 파일이 아니에요.' };

  let migrated: unknown;
  try {
    migrated = migrate(envelope.data.data, envelope.data.version);
  } catch (e) {
    return { ok: false, reason: e instanceof MigrationError ? e.message : '백업을 변환하지 못했어요.' };
  }
  const parsed = DataStateSchema.safeParse(migrated);
  if (!parsed.success) return { ok: false, reason: '백업 내용이 손상됐어요.' };
  return { ok: true, state: parsed.data };
}

/** 백업으로 현재 데이터를 통째로 바꾼다 */
export function importBackup(json: string): ImportResult {
  const result = parseBackup(json);
  if (result.ok) replaceState(result.state);
  return result;
}
