import { countStates, dayCells, reasonStats, reasonWarning, summaryNotes, type DayCell } from '@/lib/calc';
import { makeAnswers, makeItem, makeQuestions } from '@/test/factories';
import type { DailyAnswer, Question } from '@/types';

/** i번째 날 답: 0 있었어요 · 1 딱히 없었어요 · 2 잘 모르겠어요 · null 미응답 */
function answersByIndex(itemId: string, start: string, questions: Question[], picks: (0 | 1 | 2 | null)[]): DailyAnswer[] {
  const normal = questions.filter((q) => q.variant === 'normal');
  const [y, m, d] = start.split('-').map(Number);
  return picks.flatMap((p, i) => {
    if (p === null) return [];
    const dt = new Date(y, m - 1, d + i, 12);
    const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const q = normal[i % normal.length];
    return [{ id: `a${i}`, itemId, date, questionId: q.id, optionId: q.options[p].id, at: dt.toISOString() }];
  });
}

const cellsOf = (s: string): DayCell[] =>
  [...s].map((ch, i) => ({
    date: `d${i}`,
    state: ({ Y: 'yes', N: 'no', U: 'unsure', M: 'missed', P: 'pending' } as const)[ch as 'Y' | 'N' | 'U' | 'M' | 'P'],
  }));

describe('dayCells', () => {
  it('답 종류 · 미응답 · 남은 날', () => {
    const item = makeItem({ start: '2026-10-01', duration: 7 });
    const questions = makeQuestions(item);
    const answers = answersByIndex(item.id, '2026-10-01', questions, [0, 1, 2, null, 0]);
    const cells = dayCells({ item, questions, answers, today: '2026-10-05' });
    expect(cells.map((c) => c.state)).toEqual(['yes', 'no', 'unsure', 'missed', 'yes', 'pending', 'pending']);
    expect(countStates(cells)).toEqual({ yes: 2, no: 1, unsure: 1, missed: 1, pending: 2 });
  });

  it('countsAsUse로 사용일을 판단 (makeAnswers와 같은 결과)', () => {
    const item = makeItem({ start: '2026-10-01', duration: 3 });
    const questions = makeQuestions(item);
    const cells = dayCells({ item, questions, answers: makeAnswers(item, questions, [true, false, true]), today: '2026-10-10' });
    expect(countStates(cells).yes).toBe(2);
  });
});

describe('summaryNotes', () => {
  it('시안 예: 있었어요가 처음 4일에 몰림', () => {
    expect(summaryNotes(cellsOf('YYUYNNNNNNNNUN'))[0]).toEqual({ kind: 'frontLoaded', days: 4 });
  });
  it('한 번도 필요 없음 · 꾸준히 필요 · 모르겠어요 많음 · 미응답', () => {
    expect(summaryNotes(cellsOf('NNNNNNN'))).toEqual([{ kind: 'neverNeeded' }]);
    expect(summaryNotes(cellsOf('YYNYYYY'))[0]).toEqual({ kind: 'steady' });
    expect(summaryNotes(cellsOf('UUNUNYN'))).toContainEqual({ kind: 'mostlyUnsure', count: 3 });
    expect(summaryNotes(cellsOf('YNMMN'))).toContainEqual({ kind: 'missed', count: 2 });
    expect(summaryNotes(cellsOf('MMM'))).toEqual([{ kind: 'missed', count: 3 }]);
    expect(summaryNotes(cellsOf('NYNNYNN'))).toEqual([{ kind: 'mixed', yes: 2, no: 5 }]);
  });
});

describe('reasonWarning', () => {
  it('이 물건의 이유 중 포기율이 높은 이유', () => {
    const items = [
      makeItem({ status: 'abandoned', reasons: ['discount_limited'] }),
      makeItem({ status: 'abandoned', reasons: ['discount_limited'] }),
      makeItem({ status: 'bought', reasons: ['discount_limited', 'need'] }),
      makeItem({ status: 'bought', reasons: ['need'] }),
    ];
    const target = makeItem({ reasons: ['discount_limited', 'need'] });
    expect(reasonWarning(target, reasonStats(items))).toEqual({ reason: 'discount_limited', abandonRate: 2 / 3 });
    expect(reasonWarning(makeItem({ reasons: ['need'] }), reasonStats(items))).toBeNull();
  });
});
