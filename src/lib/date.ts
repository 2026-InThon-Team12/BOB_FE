/**
 * 날짜 유틸 (순수 함수). 날짜 비교는 로컬 기준 날짜 키(YYYY-MM-DD)로 한다.
 * "지금"은 여기서 읽지 않는다 — 데모 시간 이동이 반영된 현재 시각은 @/data의 getNow()/useToday()를 쓴다.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toMonthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** ISO 타임스탬프 → 로컬 날짜 키 */
export const dateKeyOf = (iso: string) => toDateKey(new Date(iso));
/** ISO 타임스탬프 → 로컬 월 키 */
export const monthKeyOf = (iso: string) => toMonthKey(new Date(iso));

const keyToUtc = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** b - a (일). 서머타임과 관계없이 날짜 차이만 센다 */
export const diffDays = (a: string, b: string) => Math.round((keyToUtc(b) - keyToUtc(a)) / DAY_MS);

export const addDays = (key: string, days: number) => {
  const t = new Date(keyToUtc(key) + days * DAY_MS);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

/** 실제 현재 시각에 데모 offset(일)을 더한 시각 */
export const shiftedNow = (offsetDays: number, base: number = Date.now()) => new Date(base + offsetDays * DAY_MS);

/** 월 키의 일수 */
export const daysInMonth = (monthKey: string) => {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

/** "2026-10" + 1 → "2026-11" */
export const addMonths = (monthKey: string, n: number) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toMonthKey(d);
};
