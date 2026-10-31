/** 표시용 포맷 (순수 함수) */

const group = (n: number) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 12000 → "12,000원" */
export const formatWon = (n: number) => `${n < 0 ? '-' : ''}${group(n)}원`;

/**
 * 짧은 금액. 23000 → "2.3만 원", 7000 → "7천 원", 120000 → "12만 원", 950 → "950원"
 */
export function formatWonShort(n: number): string {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(Math.round(n));
  if (v >= 10_000) {
    const man = Math.round(v / 1_000) / 10;
    return `${sign}${Number.isInteger(man) ? group(man) : man.toFixed(1)}만 원`;
  }
  if (v >= 1_000 && v % 1_000 === 0) return `${sign}${v / 1_000}천 원`;
  return `${sign}${group(v)}원`;
}

/** 0.423 → "42%" */
export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

/** 입력칸 표시용: 1400000 → "1,400,000" (빈 값은 "") */
export const formatDigits = (n: number | null) => (n === null ? '' : group(n));

/** 입력 문자열 → 원 단위 정수. 숫자가 없으면 null ("1,400,000원" → 1400000) */
export function parseWon(text: string): number | null {
  const digits = text.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = Number(digits.slice(0, 13));
  return Number.isSafeInteger(n) ? n : null;
}

/** "2026-11-16" → "11월 16일" */
export const formatMonthDay = (dateKey: string) => {
  const [, m, d] = dateKey.split('-').map(Number);
  return `${m}월 ${d}일`;
};

/** "2026-10" → "10월" */
export const formatMonth = (monthKey: string) => `${Number(monthKey.split('-')[1])}월`;

// ── 조사 ────────────────────────────────────────────────

const JOSA_PAIRS = {
  '이/가': ['이', '가'],
  '을/를': ['을', '를'],
  '은/는': ['은', '는'],
  '과/와': ['과', '와'],
  '으로/로': ['으로', '로'],
} as const;
export type JosaPair = keyof typeof JOSA_PAIRS;

/** 마지막 글자에 받침이 있는지 (한글이 아니면 숫자·영문 끝소리를 대략 판단) */
function hasBatchim(word: string, pair?: JosaPair): boolean {
  const last = word.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28;
    // '으로/로'는 ㄹ 받침(8) 뒤에도 '로'를 쓴다 (예: 할인으로 · 연필로)
    if (pair === '으로/로' && jong === 8) return false;
    return jong !== 0;
  }
  // 숫자: 0 1 3 6 7 8 → 받침 있음 (영, 일, 삼, 육, 칠, 팔)
  if (/[0-9]/.test(last)) return '013678'.includes(last);
  // 영문: l m n r 등으로 끝나면 받침이 있는 것처럼 읽힌다
  return /[lmnr]/i.test(last);
}

/** josa("피규어", "이/가") → "피규어가" */
export const josa = (word: string, pair: JosaPair) => {
  const [withBatchim, without] = JOSA_PAIRS[pair];
  return `${word}${hasBatchim(word, pair) ? withBatchim : without}`;
};

/** 템플릿의 {name}, {name이/가}, {name을/를} … 를 채운다 */
export function fillName(template: string, name: string): string {
  return template.replace(/\{name(이\/가|을\/를|은\/는|과\/와|으로\/로)?\}/g, (_, pair?: JosaPair) =>
    pair ? josa(name, pair) : name,
  );
}
