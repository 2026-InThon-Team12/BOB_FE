/**
 * 저장소 어댑터. 웹은 localStorage, 네이티브는 AsyncStorage에 저장된다.
 * 저장 방식을 바꾸려면(예: SQLite) 이 파일만 고친다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const STORAGE_KEY = 'bob-data';
const CORRUPT_PREFIX = 'bob-data-corrupt-';

export const persistStorage = createJSONStorage(() => AsyncStorage);

/** 검증에 실패한 저장 데이터를 지우기 전에 따로 보관한다 (복구용) */
export async function quarantine(raw: unknown): Promise<string> {
  const key = `${CORRUPT_PREFIX}${Date.now()}`;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(raw));
  } catch {
    // 보관 실패는 무시 (용량 초과 등) — 앱은 초기 상태로 계속 동작한다
  }
  return key;
}
