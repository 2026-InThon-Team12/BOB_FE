import { policy } from '@/config/policy';
import {
  bucketForCategory,
  dailySaving,
  delayDays,
  discountAmount,
  discountCheck,
  payAmount,
  discretionaryLimit,
  expectedAchieveDate,
  goalProgress,
  goalSetupPreview,
  goalStats,
  latestBudget,
  remainingBudget,
} from '@/lib/calc';
import type { DiscountRule, Expense, Goal, ImpulseEvent, MonthlyBudget } from '@/types';
import { isoAt, makeItem } from '@/test/factories';

describe('discountCheck (기능 5, 명세서 4.11 예시)', () => {
  const rule: DiscountRule = { minAmount: 30_000, value: 10, unit: 'pct', freeShipOn: true, freeShipMin: 40_000, shipFee: 3_000 };
  const shirt = { name: '반팔 티셔츠', price: 20_000, planned: true };
  const socks = { name: '양말 3팩', price: 10_000, planned: false };

  it('함정: 양말을 끄면 23,000원 vs 다 사면 30,000원 → 7,000원 더 씀, 무료배송까지 10,000원', () => {
    const r = discountCheck({ lines: [shirt, socks], rule });
    expect(r).toMatchObject({ verdict: 'trap', payNeeded: 23_000, payAll: 30_000, extra: 7_000 });
    expect(r.freeShipping).toEqual({ remaining: 10_000, savedByPayingShip: 6_000 });
  });

  it('똑똑한 묶음: 둘 다 필요하면 할인 없이 33,000원 → 30,000원, 3,000원 아낌', () => {
    const r = discountCheck({ lines: [shirt, { ...socks, planned: true }], rule });
    expect(r).toMatchObject({ verdict: 'smart', noDiscountPay: 33_000, payAll: 30_000, saved: 3_000 });
  });

  it('결과 카드 구성 내역 (상품 − 할인 + 배송비)', () => {
    const r = discountCheck({ lines: [shirt, socks], rule });
    expect(r.breakdown.needed).toEqual({ product: 20_000, discount: 0, shipping: 3_000 });
    expect(r.breakdown.all).toEqual({ product: 30_000, discount: 3_000, shipping: 3_000 });
    expect(r.breakdown.noDiscount).toEqual({ product: 30_000, discount: 0, shipping: 3_000 });
  });

  it('무료배송 스위치를 끄면 기준과 관계없이 배송비, 안내 없음', () => {
    const off = { ...rule, freeShipOn: false, shipFee: 2_500 };
    expect(payAmount(45_000, off)).toBe(45_000 - 4_500 + 2_500);
    const r = discountCheck({ lines: [shirt, socks], rule: off });
    expect(r.freeShipping).toBeNull();
    expect(r.freeShippingMet).toBe(false);
    expect(r).toMatchObject({ payNeeded: 22_500, payAll: 29_500, extra: 7_000 });
  });

  it('원 단위 할인은 합계를 넘지 않고, 무료배송 기준을 넘으면 배송비 0', () => {
    expect(discountAmount(2_000, { ...rule, minAmount: 0, unit: 'won', value: 3_000 })).toBe(2_000);
    expect(payAmount(45_000, rule)).toBe(45_000 - 4_500);
    expect(payAmount(0, rule)).toBe(0);
  });
});

const budget: MonthlyBudget = {
  month: '2026-10',
  income: 2_500_000,
  food: 400_000,
  living: 600_000,
  transport: 100_000,
  saving: 500_000,
};

describe('가계부 (기능 7)', () => {
  it('자유 지출 한도와 잔액 (해당 월만)', () => {
    expect(discretionaryLimit(budget)).toBe(900_000);
    const expenses: Expense[] = [
      { id: 'e1', amount: 30_000, bucket: 'discretionary', label: 'a', source: 'manual', at: isoAt('2026-10-03') },
      { id: 'e2', amount: 20_000, bucket: 'discretionary', label: 'b', source: 'impulse', at: isoAt('2026-10-31') },
      { id: 'e3', amount: 99_000, bucket: 'discretionary', label: 'c', source: 'manual', at: isoAt('2026-09-30') },
      { id: 'e4', amount: 10_000, bucket: 'food', label: 'd', source: 'manual', at: isoAt('2026-10-10') },
    ];
    expect(remainingBudget({ budget, expenses, bucket: 'discretionary' })).toEqual({
      bucket: 'discretionary',
      limit: 900_000,
      spent: 50_000,
      remaining: 850_000,
    });
  });

  it('카테고리 → 항목', () => {
    expect(bucketForCategory('food', policy)).toBe('food');
    expect(bucketForCategory('furniture', policy)).toBe('living');
    expect(bucketForCategory('digital', policy)).toBe('discretionary');
  });
});

describe('목표 (기능 4)', () => {
  it('일평균 저축액: 직접 입력 우선, 없으면 가계부', () => {
    expect(dailySaving({ budget, override: null, policy })).toBeCloseTo(500_000 / 31);
    expect(dailySaving({ budget, override: 10_000, policy })).toBe(10_000);
    expect(dailySaving({ budget: undefined, override: null, policy })).toBeNull();
  });

  it('지연 일수 = max(1, round(지출 ÷ 일평균 저축)) — 시안: 23,000 ÷ 5,800 ≈ 4일', () => {
    expect(delayDays(23_000, 5_800)).toBe(4);
    expect(delayDays(4_800, 5_800)).toBe(1);
    expect(delayDays(1_000, 5_800)).toBe(1);
    expect(delayDays(20_000, null)).toBeNull();
  });

  it('참은 금액 + 목표 기간 중 포기한 물품', () => {
    const goal: Goal = { id: 'g1', name: '피규어', price: 100_000, isActive: true, createdAt: isoAt('2026-10-01') };
    const impulses: ImpulseEvent[] = [
      { id: 'i1', goalId: 'g1', label: '치킨', amount: 20_000, decision: 'resisted', at: isoAt('2026-10-02') },
      { id: 'i2', goalId: 'g1', label: '카페', amount: 5_000, decision: 'spent', at: isoAt('2026-10-02') },
      { id: 'i3', goalId: 'other', label: '야식', amount: 9_000, decision: 'resisted', at: isoAt('2026-10-02') },
    ];
    const items = [
      makeItem({ status: 'abandoned', price: 50_000, decidedAt: isoAt('2026-10-05') }),
      makeItem({ status: 'abandoned', price: 70_000, decidedAt: isoAt('2026-09-20') }), // 목표 전
      makeItem({ status: 'simulating', price: 30_000 }),
    ];
    expect(goalProgress({ goal, impulses, items, policy })).toEqual({
      saved: 70_000,
      ratio: 0.7,
      achieved: false,
      remaining: 30_000,
    });
    expect(goalProgress({ goal, impulses, items, policy: { abandonCountsAsResisted: false } }).saved).toBe(20_000);
  });
});

describe('예상 달성일 · 최근 가계부', () => {
  it('남은 금액 ÷ 일평균 저축액 (올림)', () => {
    expect(expectedAchieveDate(89_000, 5_800, '2026-10-31')).toBe('2026-11-16');
    expect(expectedAchieveDate(0, 5_800, '2026-10-31')).toBe('2026-10-31');
    expect(expectedAchieveDate(10_000, null, '2026-10-31')).toBeNull();
  });

  it('이번 달이 없으면 그 이전 가장 최근 달', () => {
    const b = (month: string) => ({ ...budget, month });
    const budgets = { '2026-08': b('2026-08'), '2026-09': b('2026-09'), '2026-12': b('2026-12') };
    expect(latestBudget(budgets, '2026-09')?.month).toBe('2026-09');
    expect(latestBudget(budgets, '2026-11')?.month).toBe('2026-09');
    expect(latestBudget(budgets, '2026-07')).toBeUndefined();
  });
});

describe('goalStats (목표 달성 · 진열장)', () => {
  it('참은 횟수 · 걸린 기간 · 가장 많이 참은 것', () => {
    const goal: Goal = {
      id: 'g', name: '피규어', price: 100_000, isActive: false,
      createdAt: isoAt('2026-09-01'), achievedAt: isoAt('2026-10-19'),
    };
    const impulses: ImpulseEvent[] = [
      { id: '1', goalId: 'g', label: '배달 음식', amount: 18_000, decision: 'resisted', at: isoAt('2026-09-10') },
      { id: '2', goalId: 'g', label: '배달 음식', amount: 20_000, decision: 'resisted', at: isoAt('2026-09-20') },
      { id: '3', goalId: 'g', label: '커피', amount: 4_800, decision: 'resisted', at: isoAt('2026-09-21') },
      { id: '4', goalId: 'g', label: '커피', amount: 4_800, decision: 'spent', at: isoAt('2026-09-22') },
    ];
    const items = [makeItem({ status: 'abandoned', name: '코트', price: 90_000, decidedAt: isoAt('2026-10-01') })];
    expect(goalStats({ goal, impulses, items, today: '2026-10-31', policy })).toEqual({
      resistedCount: 4,
      daysTaken: 48,
      topLabel: '배달 음식',
    });
  });
});

describe('목표 정하기 (명세서 4.8-1)', () => {
  it('옮긴 금액 = min(모은 돈, 가격), 스위치를 끄면 0', () => {
    expect(goalSetupPreview({ price: 400_000, currentSaved: 151_000, transfer: true })).toEqual({
      carried: 151_000, remaining: 249_000, ratio: 151_000 / 400_000,
    });
    expect(goalSetupPreview({ price: 100_000, currentSaved: 151_000, transfer: true })).toMatchObject({ carried: 100_000, remaining: 0 });
    expect(goalSetupPreview({ price: 400_000, currentSaved: 151_000, transfer: false })).toMatchObject({ carried: 0, remaining: 400_000 });
  });

  it('옮겨 온 금액부터 게이지가 시작한다', () => {
    const goal: Goal = { id: 'n', name: '스위치', price: 400_000, isActive: true, createdAt: isoAt('2026-10-31'), carriedAmount: 151_000 };
    expect(goalProgress({ goal, impulses: [], items: [], policy }).saved).toBe(151_000);
  });
});
