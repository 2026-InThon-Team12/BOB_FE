import { isSwipeQuestion, reflectionCounts, swipeAnswer, type Json } from '@/lib/apkDomain';

const card = (code: string): Json => ({
  template_version: 'swipe-v2',
  answer_spec: {
    type: 'CHOICE', interaction: 'SWIPE', polarity: 'PURCHASE_SUPPORT',
    options: [{ code: 'NO' }, { code: 'YES' }, { code: 'UNSURE' }],
  },
  answer: { choice_code: code },
});

it('keeps swipe direction independent of server option order', () => {
  expect(isSwipeQuestion(card('YES'))).toBe(true);
  expect(swipeAnswer('right')).toBe('YES');
  expect(swipeAnswer('up')).toBe('UNSURE');
  expect(swipeAnswer('left')).toBe('NO');
});

it('counts unknown separately and never reinterprets older yes/no or numeric answers', () => {
  expect(reflectionCounts([
    card('YES'), card('UNSURE'), card('NO'), card('YES'),
    { ...card('YES'), template_version: 'local-v1' },
    { ...card('YES'), answer: { number_value: 12 } },
    { ...card('YES'), answer: null },
  ])).toEqual({ YES: 2, UNSURE: 1, NO: 1 });
});

it('does not enable swiping for a reversed polarity or non-choice contract', () => {
  const q = card('YES');
  expect(isSwipeQuestion({ ...q, answer_spec: { type: 'INTEGER' } })).toBe(false);
  expect(isSwipeQuestion({ ...q, template_version: 'pre-v1' })).toBe(false);
});
