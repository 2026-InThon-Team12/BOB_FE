/**
 * 기능 5: 할인 함정 확인 (명세서 4.11 · 5장 계산식)
 * - 할인액: 합계 ≥ 최소금액일 때 % → round(합계 × 율 / 100), 원 → 고정액 (합계 초과 불가)
 * - 결제액: 합계 − 할인액 + (무료배송 켜짐 && 합계 ≥ 무료배송 기준 ? 0 : 배송비)
 * - 함정: 꺼진 품목이 있고 추가 지출(전체 결제액 − 켜진 품목 결제액) > 0, 그 외는 똑똑한 묶음
 */
import type { CartLine, DiscountRule } from '@/types';

export function discountAmount(sum: number, rule: DiscountRule): number {
  if (sum < rule.minAmount) return 0;
  return Math.min(sum, rule.unit === 'pct' ? Math.round((sum * rule.value) / 100) : rule.value);
}

/** 배송비: 무료배송 켜짐 && 합계 ≥ 기준이면 0 (담은 게 없으면 0) */
export function shippingFee(sum: number, rule: DiscountRule): number {
  if (sum === 0) return 0;
  return rule.freeShipOn && sum >= rule.freeShipMin ? 0 : rule.shipFee;
}

export function payAmount(sum: number, rule: DiscountRule): number {
  if (sum === 0) return 0;
  return sum - discountAmount(sum, rule) + shippingFee(sum, rule);
}

/** 결과 카드 금액 아래 구성 내역: 상품 X원 − 할인 Y원 + 배송비 Z원 (무료면 · 무료배송) */
export type CostBreakdown = { product: number; discount: number; shipping: number } | null;

export function costBreakdown(sum: number, rule: DiscountRule, withDiscount: boolean): CostBreakdown {
  if (sum === 0) return null;
  return { product: sum, discount: withDiscount ? discountAmount(sum, rule) : 0, shipping: shippingFee(sum, rule) };
}

export type DiscountCheck = {
  verdict: 'trap' | 'smart';
  /** 전체 합계 / 켜진(필요한) 품목 합계 */
  total: number;
  neededTotal: number;
  /** 다 사면 / 필요한 것만 사면 낼 돈 */
  payAll: number;
  payNeeded: number;
  /** 할인 받으려고 더 쓰는 돈 (함정일 때) */
  extra: number;
  /** 할인 없이 샀다면 대비 아낀 돈 (똑똑한 묶음일 때) */
  saved: number;
  /** 할인 없이 샀다면 낼 돈 (합계 + 배송비 적용) */
  noDiscountPay: number;
  /** 무료배송까지 남은 금액 안내 (이미 채웠거나 무료배송 조건이 없으면 null) */
  freeShipping: { remaining: number; savedByPayingShip: number } | null;
  /** 무료배송 조건을 채웠는지 (스위치가 꺼져 있으면 false) */
  freeShippingMet: boolean;
  breakdown: { needed: CostBreakdown; all: CostBreakdown; noDiscount: CostBreakdown };
};

export function discountCheck(params: { lines: CartLine[]; rule: DiscountRule }): DiscountCheck {
  const { lines, rule } = params;
  const total = lines.reduce((s, l) => s + l.price, 0);
  const neededTotal = lines.filter((l) => l.planned).reduce((s, l) => s + l.price, 0);
  const payAll = payAmount(total, rule);
  const payNeeded = payAmount(neededTotal, rule);
  const extra = payAll - payNeeded;
  const allOn = neededTotal === total;
  const noDiscountPay = total + shippingFee(total, rule);
  const remaining = rule.freeShipOn ? rule.freeShipMin - total : 0;

  return {
    verdict: !allOn && extra > 0 ? 'trap' : 'smart',
    total,
    neededTotal,
    payAll,
    payNeeded,
    extra: Math.max(0, extra),
    saved: Math.max(0, noDiscountPay - payAll),
    noDiscountPay,
    freeShipping: remaining > 0 ? { remaining, savedByPayingShip: Math.max(0, payAmount(rule.freeShipMin, rule) - payAll) } : null,
    freeShippingMet: rule.freeShipOn && total >= rule.freeShipMin,
    breakdown: {
      needed: costBreakdown(neededTotal, rule, true),
      all: costBreakdown(total, rule, true),
      noDiscount: costBreakdown(total, rule, false),
    },
  };
}
