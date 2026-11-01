import { todayAnswers } from '@/lib/calc/todayAnswers';
import { isoAt, makeItem, makeQuestions } from '@/test/factories';
import type { DailyAnswer } from '@/types';

const today = '2026-11-01';
const response = (itemId: string, questionId: string, date = today): DailyAnswer => ({
  id: `answer:${questionId}`, itemId, questionId, date, at: isoAt(date),
  optionId: 'YES', value: { choice_code: 'YES' }, label: '필요했어요',
});

it('shows only today’s surviving items and puts final observation days first', () => {
  const active = makeItem({ start: today, duration: 7 });
  const finished = makeItem({ start: '2026-10-30', duration: 3 });
  const answers = [response(active.id, 'active'), response('deleted', 'deleted'), response(active.id, 'old', '2026-10-31'), response(finished.id, 'finished')];
  const rows = todayAnswers([active, finished], [], answers, today);
  expect(rows.map(row => row.itemId)).toEqual([finished.id, active.id]);
  expect(rows[0]).toMatchObject({ day: 3, totalDays: 3, finishedToday: true });
  expect(rows[1]).toMatchObject({ day: 1, totalDays: 7, finishedToday: false });
});

it('uses shortened observation dates and does not mark post-purchase answers as simulation completion', () => {
  const item = makeItem();
  item.simulation.observationDates = ['2026-10-31', today];
  const question = { ...makeQuestions(item)[0], phase: 'post' as const };
  const rows = todayAnswers([item], [question], [response(item.id, question.id)], today);
  expect(rows[0]).toMatchObject({ day: 2, totalDays: 2, post: true, finishedToday: false });
});

it('keeps distinct responses and their actual labels when a pre and post question share a day', () => {
  const item = makeItem({ start: today });
  const pre = { ...makeQuestions(item)[0], id: 'pre', phase: 'pre' as const };
  const post = { ...pre, id: 'post', phase: 'post' as const };
  const answers = [response(item.id, pre.id), { ...response(item.id, post.id), value: { text_value: '출퇴근할 때 사용했어요' }, label: '출퇴근할 때 사용했어요' }];
  expect(todayAnswers([item], [pre, post], answers, today).map(row => row.label)).toEqual(['필요했어요', '출퇴근할 때 사용했어요']);
});
