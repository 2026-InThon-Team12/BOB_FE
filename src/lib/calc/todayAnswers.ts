import type { DailyAnswer, Item, Question } from '@/types';

import { simulationDayKeys } from './simulation';

/** Today's saved responses, with final observation-day responses first. */
export function todayAnswers(items: Item[], questions: Question[], answers: DailyAnswer[], today: string) {
  const itemById = new Map(items.map(item => [item.id, item]));
  const questionById = new Map(questions.map(question => [question.id, question]));
  return answers.filter(answer => answer.date === today && !!answer.value).flatMap(answer => {
    const item = itemById.get(answer.itemId);
    if (!item) return [];
    const question = questionById.get(answer.questionId);
    const days = simulationDayKeys(item);
    const post = question?.phase === 'post';
    return [{
      itemId: item.id, name: item.name, category: item.category, price: item.price,
      questionId: answer.questionId,
      label: answer.label ?? question?.options.find(option => option.id === answer.optionId)?.label ?? '',
      positive: answer.value?.choice_code === 'YES',
      post,
      day: days.filter(day => day <= today).length,
      totalDays: days.length,
      finishedToday: !post && days.length > 0 && days[days.length - 1] === today,
    }];
  }).sort((a, b) => Number(b.finishedToday) - Number(a.finishedToday));
}

export type TodayAnswerRow = ReturnType<typeof todayAnswers>[number];
