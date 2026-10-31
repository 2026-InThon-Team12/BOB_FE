import {
  addExpense,
  addItems,
  answerToday,
  createGoal,
  decideItem,
  getToday,
  recordImpulse,
  removeExpense,
  removeImpulse,
  removeItem,
  resetAllData,
  resetClock,
  setMonthlyBudget,
  shiftClock,
  submitReview,
  updateItem,
} from '@/data';
import { getState } from '@/data/store';
import type { ConfirmedItemInput } from '@/types';

const input = (over: Partial<ConfirmedItemInput> = {}): ConfirmedItemInput => ({
  name: '니트 가디건',
  price: 59_000,
  category: 'clothing',
  reasons: ['discount_limited'],
  source: 'manual',
  ...over,
});

const expectCode = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (e) {
    expect((e as { code?: string }).code).toBe(code);
    return;
  }
  throw new Error('예외가 발생하지 않았어요');
};

beforeEach(() => {
  resetAllData();
  resetClock();
});

describe('물품 등록', () => {
  it('가격 구간으로 기간을 정하고 질문 세트를 만든다', () => {
    const [item] = addItems([input()]);
    const s = getState();
    expect(item.status).toBe('simulating');
    expect(item.simulation.durationDays).toBe(7);
    const questions = Object.values(s.questions).filter((q) => q.itemId === item.id);
    expect(questions.some((q) => q.variant === 'normal')).toBe(true);
    expect(questions.some((q) => q.variant === 'recheck')).toBe(true);
  });

  it('이름이 비었거나 가격이 잘못되면 거부', () => {
    expectCode(() => addItems([input({ name: '  ' })]), 'invalid_input');
    expectCode(() => addItems([input({ price: -1 })]), 'invalid_input');
    expect(Object.keys(getState().items)).toHaveLength(0);
  });

  it('가격을 바꾸면 기간도 다시 계산, 카테고리를 바꾸면 AI 신뢰도 제거', () => {
    const [item] = addItems([input({ categoryConfidence: 0.9 })]);
    const updated = updateItem(item.id, { price: 150_000, category: 'digital' });
    expect(updated.simulation.durationDays).toBe(14);
    expect(updated.categoryConfidence).toBeUndefined();
  });
});

describe('결정 흐름', () => {
  it('기간 중에도 구매와 포기가 가능', () => {
    const [a, b] = addItems([input(), input({ name: '조명' })]);
    expect(decideItem(a.id, 'buy').status).toBe('bought');
    expect(Object.values(getState().expenses).filter((e) => e.refId === a.id)).toHaveLength(1);
    expectCode(() => decideItem(a.id, 'buy'), 'invalid_transition');
    expect(decideItem(b.id, 'abandon').status).toBe('abandoned');
  });

  it('기간이 끝나면 구매 → 지출 기록 → 14일 뒤 점검', () => {
    const [item] = addItems([input()]);
    shiftClock(7);
    const bought = decideItem(item.id, 'buy');
    expect(bought.status).toBe('bought');
    const expense = Object.values(getState().expenses).find((e) => e.refId === item.id)!;
    expect(expense).toMatchObject({ amount: 59_000, bucket: 'discretionary', source: 'item' });

    expectCode(() => submitReview(item.id, { usageBucket: 'sometimes' }), 'invalid_transition');
    shiftClock(14);
    expectCode(() => submitReview(item.id, { usageBucket: 'nope' }), 'invalid_input');
    const reviewed = submitReview(item.id, { usageBucket: 'DAYS_1_3' });
    expect(reviewed.review).toMatchObject({ usageBucket: 'DAYS_1_3', usedDays: 2 });
    expectCode(() => submitReview(item.id, { usageBucket: 'DAYS_11_14' }), 'invalid_transition');
  });

  it('보류 = 7일 연장, 지금까지의 답은 유지하고 다시 질문을 받는다', () => {
    const [item] = addItems([input()]);
    const q = Object.values(getState().questions).find((x) => x.itemId === item.id && x.variant === 'normal')!;
    answerToday({ itemId: item.id, questionId: q.id, optionId: q.options[0].id });
    shiftClock(7);
    const held = decideItem(item.id, 'hold');
    expect(held.status).toBe('simulating');
    expect(held.simulation).toMatchObject({ startAt: item.simulation.startAt, durationDays: 14 });
    expect(held.simulation.observationDates).not.toContain(getToday());
    expect(Object.values(getState().answers)).toHaveLength(1);
    // 보류 당일은 관찰하지 않고 다음 날부터 다시 질문한다
    expectCode(() => answerToday({ itemId: item.id, questionId: q.id, optionId: q.options[1].id }), 'invalid_transition');
    shiftClock(1);
    answerToday({ itemId: item.id, questionId: q.id, optionId: q.options[1].id });
    expect(Object.values(getState().answers)).toHaveLength(2);
    expect(decideItem(item.id, 'buy').status).toBe('bought');
  });
});

describe('매일 답변', () => {
  it('하루 한 개, 다시 답하면 바뀐다', () => {
    const [item] = addItems([input()]);
    const q = Object.values(getState().questions).find((x) => x.itemId === item.id && x.variant === 'normal')!;
    answerToday({ itemId: item.id, questionId: q.id, optionId: q.options[0].id });
    const second = answerToday({ itemId: item.id, questionId: q.id, optionId: q.options[1].id });
    const answers = Object.values(getState().answers);
    expect(answers).toHaveLength(1);
    expect(answers[0]).toMatchObject({ optionId: q.options[1].id, date: getToday(), id: second.id });
  });

  it('다른 물품의 질문, 없는 선택지, 기간 밖은 거부', () => {
    const [a, b] = addItems([input(), input({ name: '조명' })]);
    const qa = Object.values(getState().questions).find((x) => x.itemId === a.id)!;
    expectCode(() => answerToday({ itemId: b.id, questionId: qa.id, optionId: qa.options[0].id }), 'invalid_input');
    expectCode(() => answerToday({ itemId: a.id, questionId: qa.id, optionId: 'nope' }), 'invalid_input');
    shiftClock(7);
    expectCode(() => answerToday({ itemId: a.id, questionId: qa.id, optionId: qa.options[0].id }), 'invalid_transition');
  });

  it('물품을 지우면 질문·답변·구매 지출도 지운다', () => {
    const [item] = addItems([input()]);
    const q = Object.values(getState().questions).find((x) => x.itemId === item.id)!;
    answerToday({ itemId: item.id, questionId: q.id, optionId: q.options[0].id });
    shiftClock(7);
    decideItem(item.id, 'buy');
    removeItem(item.id);
    const s = getState();
    expect(Object.keys(s.items)).toHaveLength(0);
    expect(Object.keys(s.questions)).toHaveLength(0);
    expect(Object.keys(s.answers)).toHaveLength(0);
    expect(Object.keys(s.expenses)).toHaveLength(0);
  });
});

describe('목표 · 참기 · 지출', () => {
  it('새 목표를 만들면 이전 목표는 비활성', () => {
    const first = createGoal({ name: '피규어', price: 280_000, productUrl: '  https://shop.example.com/figure  ' });
    const second = createGoal({ name: '여행', price: 500_000 });
    const goals = getState().goals;
    expect(goals[first.id].isActive).toBe(false);
    expect(goals[first.id].productUrl).toBe('https://shop.example.com/figure');
    expect(goals[second.id].isActive).toBe(true);
  });

  it('참았어요는 활성 목표에, 그냥 샀어요는 지출 원장에', () => {
    const goal = createGoal({ name: '피규어', price: 280_000 });
    const resisted = recordImpulse({ label: '치킨', amount: 23_000, decision: 'resisted' });
    const spent = recordImpulse({ label: '카페', amount: 6_500, decision: 'spent' });
    expect(resisted.goalId).toBe(goal.id);
    const expenses = Object.values(getState().expenses);
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ refId: spent.id, source: 'impulse', bucket: 'discretionary' });

    expectCode(() => removeExpense(expenses[0].id), 'invalid_transition');
    removeImpulse(spent.id);
    expect(Object.values(getState().expenses)).toHaveLength(0);
  });

  it('직접 입력 지출과 가계부 검증', () => {
    const e = addExpense({ label: '인형뽑기', amount: 10_000, bucket: 'discretionary' });
    removeExpense(e.id);
    expect(Object.values(getState().expenses)).toHaveLength(0);
    expectCode(() => addExpense({ label: 'x', amount: 0, bucket: 'food' }), 'invalid_input');
    expectCode(
      () => setMonthlyBudget({ month: '2026-13', income: 1, food: 0, living: 0, transport: 0, saving: 0 }),
      'invalid_input',
    );
  });
});
