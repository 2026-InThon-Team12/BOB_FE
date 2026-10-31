/** 테스트용 데이터 생성 */
import { defaultQuestionTemplates } from '@/constants/questionTemplates';
import { buildQuestions } from '@/lib/calc';
import { addDays, dateKeyOf } from '@/lib/date';
import type { DailyAnswer, Item, Question } from '@/types';

let seq = 0;
export const testId = (p = 'id') => `${p}${++seq}`;

/** 로컬 날짜 키 → 그날 정오의 ISO (시간대와 관계없이 같은 날짜 키가 나오도록) */
export const isoAt = (dateKey: string) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toISOString();
};

export function makeItem(overrides: Partial<Item> & { start?: string; duration?: number } = {}): Item {
  const { start = '2026-10-01', duration = 7, ...rest } = overrides;
  return {
    id: testId('it'),
    name: '테스트 물건',
    price: 50_000,
    category: 'digital',
    reasons: [],
    source: 'manual',
    status: 'simulating',
    createdAt: isoAt(start),
    simulation: { startAt: isoAt(start), durationDays: duration },
    ...rest,
  };
}

export const makeQuestions = (item: Item): Question[] =>
  buildQuestions({
    itemId: item.id,
    templates: defaultQuestionTemplates(item.category),
    fallbackTemplates: [],
    createId: () => testId('q'),
  });

/** used[i] = i번째 날 사용 여부 (null이면 그날 답 없음) */
export function makeAnswers(item: Item, questions: Question[], used: (boolean | null)[]): DailyAnswer[] {
  const normal = questions.filter((q) => q.variant === 'normal');
  const start = dateKeyOf(item.simulation.startAt);
  return used.flatMap((u, i) => {
    if (u === null) return [];
    const date = addDays(start, i);
    const q = normal[i % normal.length];
    const option = q.options.find((o) => o.countsAsUse === u)!;
    return [{ id: testId('an'), itemId: item.id, date, questionId: q.id, optionId: option.id, at: isoAt(date) }];
  });
}
