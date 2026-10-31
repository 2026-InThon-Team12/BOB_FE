import { monthlySummary, predictionVerdict, tendencyBadge } from '@/lib/calc';
import type { ImpulseEvent } from '@/types';
import { isoAt, makeItem } from '@/test/factories';

describe('predictionVerdict (구매 후 점검)', () => {
  it('시안 예: 11일 예측, 실제 1–4일(2.5) → 훨씬 덜 씀, 4분의 1', () => {
    expect(predictionVerdict(11 / 2.5, 2.5)).toEqual({ kind: 'muchLess', fraction: 4 });
  });
  it('구간별', () => {
    expect(predictionVerdict(1.2, 5)).toEqual({ kind: 'less' });
    expect(predictionVerdict(1, 7)).toEqual({ kind: 'same' });
    expect(predictionVerdict(0.5, 12)).toEqual({ kind: 'more' });
    expect(predictionVerdict(Infinity, 0)).toEqual({ kind: 'never' });
  });
});

describe('tendencyBadge (리포트, 명세서 4.12)', () => {
  it('≥2 과대예측 · 1.3–2 중립 · <1.3 거의 정확', () => {
    expect(tendencyBadge(4.5)).toEqual({ kind: 'over', ratio: 4.5 });
    expect(tendencyBadge(2)).toEqual({ kind: 'over', ratio: 2 });
    expect(tendencyBadge(1.8)).toEqual({ kind: 'slight', ratio: 1.8 });
    expect(tendencyBadge(1.1)).toEqual({ kind: 'accurate' });
    expect(tendencyBadge(0.6)).toEqual({ kind: 'accurate' });
    expect(tendencyBadge(Infinity).kind).toBe('over');
  });
});

describe('monthlySummary', () => {
  it('이번 달 등록 · Bye · 지킨 돈', () => {
    const items = [
      makeItem({ createdAt: isoAt('2026-10-02'), status: 'abandoned', price: 50_000, decidedAt: isoAt('2026-10-09') }),
      makeItem({ createdAt: isoAt('2026-09-25'), status: 'abandoned', price: 30_000, decidedAt: isoAt('2026-10-01') }),
      makeItem({ createdAt: isoAt('2026-10-05'), status: 'bought', price: 99_000, decidedAt: isoAt('2026-10-12') }),
      makeItem({ createdAt: isoAt('2026-09-01'), status: 'abandoned', price: 70_000, decidedAt: isoAt('2026-09-08') }),
    ];
    const impulses: ImpulseEvent[] = [
      { id: 'a', label: '치킨', amount: 23_000, decision: 'resisted', at: isoAt('2026-10-20') },
      { id: 'b', label: '카페', amount: 5_000, decision: 'spent', at: isoAt('2026-10-21') },
    ];
    expect(monthlySummary({ items, impulses, month: '2026-10' })).toEqual({
      registered: 2,
      byeCount: 2,
      savedMoney: 50_000 + 30_000 + 23_000,
    });
  });
});
