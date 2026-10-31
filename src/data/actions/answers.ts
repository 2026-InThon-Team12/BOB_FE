/** 시뮬레이션 매일 답변 (기능 1) */
import { policy } from '@/config/policy';
import { derivePhase, simulationDayKeys } from '@/lib/calc';
import { createId } from '@/lib/id';
import type { DailyAnswer } from '@/types';

import { getNowIso, getToday } from '../clock';
import { DataError } from '../errors';
import { getState, update } from '../store';

/** 오늘 답을 기록한다. 오늘 이미 답했으면 바꾼다 (물품당 하루 1개) */
export function answerToday(params: { itemId: string; questionId: string; optionId: string }): DailyAnswer {
  const { itemId, questionId, optionId } = params;
  const s = getState();
  const item = s.items[itemId];
  const question = s.questions[questionId];
  const today = getToday();

  if (!item) throw new DataError(`물품을 찾을 수 없어요: ${itemId}`, 'not_found');
  if (!question || question.itemId !== itemId) throw new DataError('이 물품의 질문이 아니에요.', 'invalid_input');
  if (!question.options.some((o) => o.id === optionId)) throw new DataError('없는 선택지예요.', 'invalid_input');
  if (derivePhase(item, today, policy) !== 'simulating' || !simulationDayKeys(item).includes(today)) {
    throw new DataError('지금은 답할 수 있는 기간이 아니에요.', 'invalid_transition');
  }

  const existing = Object.values(s.answers).find((a) => a.itemId === itemId && a.date === today);
  const answer: DailyAnswer = {
    id: existing?.id ?? createId('an_'),
    itemId,
    date: today,
    questionId,
    optionId,
    at: getNowIso(),
  };
  update((st) => ({ answers: { ...st.answers, [answer.id]: answer } }));
  return answer;
}
