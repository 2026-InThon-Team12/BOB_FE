/**
 * 정책 값 — 기능 정의서에서 "미정"인 값을 모아 둔 곳.
 * 팀 결정이 나면 이 파일만 고친다. (팀원_확인사항.md 3번 표와 같은 순서)
 */
import type { BucketId, CategoryId } from '@/types';

export type SimulationBand = { /** 이 금액 이하이면 */ maxPrice: number; days: number };

/** 구매 후 점검 답변 구간 (라벨은 copy.review.buckets) */
export type UsageBucket = { id: string; minDays: number; maxDays: number; /** 계산에 쓰는 대표 일수 */ usedDays: number };

export const policy = {
  hourlyRate: 10_700,
  startupMs: 1500,
  cartSelectionLimit: 10,
  /** #1 시뮬레이션 기간: 가격 구간별 일수 (오름차순, 마지막은 Infinity) */
  simulationBands: [
    { maxPrice: 30_000, days: 3 },
    { maxPrice: 99_999, days: 7 },
    { maxPrice: Infinity, days: 14 },
  ] as SimulationBand[],

  /** "조금 더 지켜볼게요 · 7일 보류" — 시뮬레이션을 연장하는 일수 (디자인 시안) */
  holdDays: 7,

  /** #2 구매 후 실사용 점검 시점 (구매일로부터 일수) */
  reviewAfterDays: 14,

  /** 구매 후 2주 사용일수 — 한 번만 응답 */
  reviewUsageBuckets: [
    { id: 'DAYS_1_3', minDays: 1, maxDays: 3, usedDays: 2 },
    { id: 'DAYS_4_7', minDays: 4, maxDays: 7, usedDays: 5.5 },
    { id: 'DAYS_8_10', minDays: 8, maxDays: 10, usedDays: 9 },
    { id: 'DAYS_11_14', minDays: 11, maxDays: 14, usedDays: 12.5 },
  ] as UsageBucket[],
  /** 기존 기록을 원래 구간으로 읽기 위한 정의 */
  legacyReviewUsageBuckets: [
    { id: 'daily', minDays: 10, maxDays: 14, usedDays: 12 },
    { id: 'often', minDays: 5, maxDays: 9, usedDays: 7 },
    { id: 'sometimes', minDays: 1, maxDays: 4, usedDays: 2.5 },
    { id: 'never', minDays: 0, maxDays: 0, usedDays: 0 },
  ] as UsageBucket[],

  /** #3 매일 질문 알림 시각 (HH:mm, 로컬) — 디자인 시안: 저녁 8시 */
  dailyNotifyTime: '20:00',

  /** 참기(목표 탭) 자주 쓰는 항목과 기본 금액 (디자인 시안) */
  impulsePresets: [
    { label: '커피', amount: 4_800 },
    { label: '치킨', amount: 23_000 },
    { label: '떡볶이 배달', amount: 18_000 },
    { label: '인형뽑기', amount: 10_000 },
  ],

  /** 할인 함정 (명세서 4.11): 조건 입력 기본값, 무료배송은 입력칸이 없어 이 값으로 계산 */
  discount: { defaultMin: 30_000, defaultPct: 10, defaultWon: 3_000, freeShipMin: 40_000, shipFee: 3_000 },

  /** #4 일평균 저축액 = 가계부 월 저축액 ÷ daysPerMonth (사용자가 직접 입력하면 그 값 우선) */
  dailySaving: { daysPerMonth: 30 },

  /** #6 시뮬레이션 포기를 행동 통계에 포함 (게이지 금액에는 포함하지 않음) */
  abandonCountsAsResisted: true,

  /** #8 카테고리 → 가계부 항목 */
  categoryToBucket: {
    food: 'food',
    daily: 'living',
    furniture: 'living',
  } as Partial<Record<CategoryId, BucketId>>,
  defaultBucket: 'discretionary' as BucketId,

  /** #9 재질문 강조 기준: 해당 분야 예측/실제 사용 비율이 이 값 이상 + 표본 수 이상 */
  emphasis: { minSamples: 1, overPredictionRatio: 2 },

  /** AI 호출 */
  // Vercel cold start + vision 분석 시간을 고려한 상한
  ai: { timeoutMs: 110_000 },

  cartImage: {
    maxBytes: 4_000_000,
    maxPixels: 12_000_000,
    maxSide: 8_000,
    pngMaxPixels: 4_000_000,
    jpegQualities: [0.94, 0.88, 0.8, 0.72, 0.64],
  },

  /** mock AI 응답 지연 (실제 호출 느낌을 내기 위함) */
  mock: { minDelayMs: 300, maxDelayMs: 800 },
};

export type Policy = typeof policy;
