import { policy } from '@/config/policy';
import {
  availableActions,
  costPerUse,
  derivePhase,
  pickTodayQuestion,
  simulationDays,
  simulationEndDay,
  usageSummary,
} from '@/lib/calc';
import { isoAt, makeAnswers, makeItem, makeQuestions } from '@/test/factories';

describe('simulationDays', () => {
  it('가격 구간별 기간 (경계 포함)', () => {
    expect(simulationDays(5_000, policy.simulationBands)).toBe(3);
    expect(simulationDays(30_000, policy.simulationBands)).toBe(3);
    expect(simulationDays(30_001, policy.simulationBands)).toBe(7);
    expect(simulationDays(99_999, policy.simulationBands)).toBe(7);
    expect(simulationDays(100_000, policy.simulationBands)).toBe(14);
    expect(simulationDays(2_000_000, policy.simulationBands)).toBe(14);
  });
});

describe('derivePhase / availableActions', () => {
  const item = makeItem({ start: '2026-10-01', duration: 7 });

  it('시뮬레이션 중 → 기간 끝나면 결정 대기', () => {
    expect(simulationEndDay(item)).toBe('2026-10-08');
    expect(derivePhase(item, '2026-10-07', policy)).toBe('simulating');
    expect(derivePhase(item, '2026-10-08', policy)).toBe('awaitingDecision');
    expect(availableActions('simulating')).toEqual(['abandon']);
    expect(availableActions('awaitingDecision')).toEqual(['buy', 'abandon', 'hold']);
  });

  it('구매 → 점검 시점에 점검 대기 → 점검 완료', () => {
    const bought = { ...item, status: 'bought' as const, purchase: { boughtAt: isoAt('2026-10-08') } };
    expect(derivePhase(bought, '2026-10-21', policy)).toBe('bought');
    expect(derivePhase(bought, '2026-10-22', policy)).toBe('awaitingReview');
    const reviewed = { ...bought, review: { usageBucket: 'sometimes', usedDays: 2.5, at: isoAt('2026-10-22') } };
    expect(derivePhase(reviewed, '2026-10-22', policy)).toBe('reviewed');
  });

  it('보류는 기간 연장 — 늘어난 기간 동안 다시 시뮬레이션', () => {
    const held = { ...item, simulation: { ...item.simulation, durationDays: 7 + policy.holdDays } };
    expect(derivePhase(held, '2026-10-08', policy)).toBe('simulating');
    expect(derivePhase(held, '2026-10-15', policy)).toBe('awaitingDecision');
    expect(availableActions('abandoned')).toEqual([]);
  });
});

describe('pickTodayQuestion', () => {
  const item = makeItem({ start: '2026-10-01', duration: 7, category: 'digital' });
  const questions = makeQuestions(item);
  const normal = questions.filter((q) => q.variant === 'normal');

  it('날짜마다 normal 질문을 돌아가며 고른다', () => {
    const day0 = pickTodayQuestion({ item, questions, answers: [], today: '2026-10-01', emphasize: false });
    const day1 = pickTodayQuestion({ item, questions, answers: [], today: '2026-10-02', emphasize: false });
    expect(day0?.id).toBe(normal[0].id);
    expect(day1?.id).toBe(normal[1].id);
  });

  it('강조 대상이면 recheck 질문', () => {
    const q = pickTodayQuestion({ item, questions, answers: [], today: '2026-10-01', emphasize: true });
    expect(q?.variant).toBe('recheck');
  });

  it('이미 답했거나 기간 밖이면 null', () => {
    const answers = makeAnswers(item, questions, [true]);
    expect(pickTodayQuestion({ item, questions, answers, today: '2026-10-01', emphasize: false })).toBeNull();
    expect(pickTodayQuestion({ item, questions, answers: [], today: '2026-09-30', emphasize: false })).toBeNull();
    expect(pickTodayQuestion({ item, questions, answers: [], today: '2026-10-08', emphasize: false })).toBeNull();
  });
});

describe('usageSummary / costPerUse', () => {
  const item = makeItem({ start: '2026-10-01', duration: 7, price: 70_000 });
  const questions = makeQuestions(item);

  it('사용일, 응답일, 미응답일 (오늘은 미응답으로 세지 않음)', () => {
    const answers = makeAnswers(item, questions, [true, false, null, true]);
    const s = usageSummary({ item, questions, answers, today: '2026-10-05' });
    expect(s).toMatchObject({ totalDays: 7, elapsedDays: 5, answeredDays: 3, usedDays: 2, unansweredDays: 1 });
  });

  it('기간이 끝나면 전체 기준', () => {
    const answers = makeAnswers(item, questions, [true, false, false, true, false, true, false]);
    const s = usageSummary({ item, questions, answers, today: '2026-10-20' });
    expect(s).toMatchObject({ elapsedDays: 7, answeredDays: 7, usedDays: 3, unansweredDays: 0 });
    expect(costPerUse(item.price, s.usedDays)).toBe(23_333);
  });

  it('다른 물품의 답이나 기간 밖 답은 세지 않는다', () => {
    const other = makeItem({ start: '2026-10-01' });
    const otherAnswers = makeAnswers(other, makeQuestions(other), [true, true]);
    const s = usageSummary({ item, questions, answers: otherAnswers, today: '2026-10-20' });
    expect(s.answeredDays).toBe(0);
    expect(costPerUse(item.price, 0)).toBeNull();
  });
});
