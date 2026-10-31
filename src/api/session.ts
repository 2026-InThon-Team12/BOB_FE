/**
 * 게스트 세션 토큰 (POST /guest-sessions).
 * 로컬 데이터 스토어(백업에 포함됨)와 분리해서 따로 저장한다 — 토큰이 백업 파일로 새지 않도록.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'bob-guest-token';

let cached: string | null | undefined;

export async function getGuestToken(): Promise<string | null> {
  if (cached === undefined) cached = await AsyncStorage.getItem(TOKEN_KEY);
  return cached;
}

export async function setGuestToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  cached = token;
}

export async function clearGuestToken(): Promise<void> {
  cached = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/** 테스트용: 메모리 캐시만 비운다 */
export const resetSessionCache = () => {
  cached = undefined;
};
