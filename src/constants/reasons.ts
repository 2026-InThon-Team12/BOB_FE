import { REASON_IDS, type ReasonId } from '@/types';

/** 구매 이유 라벨 (기능 6, 명세서 4.4 순서 고정) */
export const REASON_LABELS: Record<ReasonId, string> = {
  sns_ad: 'SNS·광고를 보고',
  discount_limited: '할인·한정 판매 때문에',
  bundle_discount: '일정 금액 이상 담으면 추가 할인을 받을 수 있어서',
  stress: '스트레스·기분 전환을 위해',
  peer: '주변 사람이 가지고 있어서',
  need: '실제로 필요해서',
  long_wanted: '오래전부터 원했던 물건이라서',
  other: '기타',
};

/** 리포트처럼 좁은 곳에 쓰는 짧은 라벨 (명세서: 리포트는 "추가 할인 받으려고") */
export const REASON_SHORT_LABELS: Record<ReasonId, string> = {
  sns_ad: 'SNS·광고',
  discount_limited: '할인·한정 판매',
  bundle_discount: '추가 할인 받으려고',
  stress: '스트레스·기분 전환',
  peer: '주변 사람이 있어서',
  need: '실제로 필요해서',
  long_wanted: '오래전부터 원함',
  other: '기타',
};

/** "~(으)로 등록" 문장에 들어가는 이름 (결과 화면 등) */
export const REASON_TOPICS: Record<ReasonId, string> = {
  sns_ad: 'SNS·광고',
  discount_limited: '할인·한정 판매',
  bundle_discount: '추가 할인',
  stress: '기분 전환',
  peer: '주변 사람',
  need: '실제 필요',
  long_wanted: '오래 원했던 마음',
  other: '기타 이유',
};

export const REASONS = REASON_IDS.map((id) => ({ id, label: REASON_LABELS[id] }));
