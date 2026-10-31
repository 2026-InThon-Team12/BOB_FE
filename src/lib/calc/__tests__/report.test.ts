import { policy } from '@/config/policy';
import { buildDemoState } from '@/data/seed';
import {
  categoryTendency,
  mostOverPredicted,
  predictedVsActual,
  reasonStats,
  shouldEmphasize,
  topAbandonReason,
} from '@/lib/calc';
import { isoAt, makeAnswers, makeItem, makeQuestions } from '@/test/factories';

describe('predictedVsActual (기능 2)', () => {
  it('예측 비율 ÷ 실제 비율', () => {
    const item = makeItem({
      start: '2026-10-01',
      duration: 7,
      status: 'bought',
      purchase: { boughtAt: isoAt('2026-10-08') },
      review: { usageBucket: 'sometimes', usedDays: 2.5, at: isoAt('2026-10-22') },
    });
    const questions = makeQuestions(item);
    const answers = makeAnswers(item, questions, [true, true, true, true, true, true, true]);
    const cmp = predictedVsActual({ item, questions, answers, policy })!;
    expect(cmp.predictedRate).toBe(1);
    expect(cmp.actualRate).toBeCloseTo(2.5 / 14);
    expect(cmp.ratio).toBeCloseTo(5.6);
    expect(cmp.predictedDays).toBe(14);
    expect(cmp.actualDays).toBe(2.5);
  });

  it('점검 전이면 null', () => {
    const item = makeItem({ status: 'bought' });
    expect(predictedVsActual({ item, questions: [], answers: [], policy })).toBeNull();
  });
});

describe('데모 시드 기준 경향·강조', () => {
  const state = buildDemoState(new Date(2026, 9, 31, 9));
  const items = Object.values(state.items);
  const questions = Object.values(state.questions);
  const answers = Object.values(state.answers);
  const tendencies = categoryTendency({ items, questions, answers, policy });

  it('디지털 분야는 과대예측 → 재질문 강조', () => {
    const digital = tendencies.find((t) => t.category === 'digital')!;
    expect(digital.samples).toBe(2);
    expect(digital.ratio).toBeGreaterThan(policy.emphasis.overPredictionRatio);
    expect(digital.actualDays).toBe(5);
    expect(shouldEmphasize('digital', tendencies, policy.emphasis)).toBe(true);
    expect(mostOverPredicted(tendencies, policy.emphasis)?.category).toBe('digital');
  });

  it('표본이 부족한 분야는 강조하지 않음', () => {
    expect(shouldEmphasize('hobby', tendencies, policy.emphasis)).toBe(false);
    expect(shouldEmphasize('clothing', tendencies, policy.emphasis)).toBe(false);
  });

  it('이유별 패턴 (기능 6): 할인 때문에 등록한 물건은 포기 비율이 높다', () => {
    const stats = reasonStats(items);
    const discount = stats.find((s) => s.reason === 'discount_limited')!;
    expect(discount).toMatchObject({ total: 3, abandoned: 2, pending: 1 });
    expect(discount.abandonRate).toBe(1);
    expect(topAbandonReason(stats)?.reason).toBe('discount_limited');
  });
});
