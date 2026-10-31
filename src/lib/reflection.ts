import type { DailyAnswer, Question } from '@/types';
import { SWIPE_QUESTION_VERSION } from '@/constants/swipeQuestionCatalog';
export type ReflectionAnswer = NonNullable<DailyAnswer['value']>;
export type AnswerSpec = { type: string; interaction?: string; polarity?: string; unit?: string; options?: {code: string; label: string; value?: number; direction?: string}[]; minimum?: number; maximum?: number; max_length?: number; fields?: Record<string, AnswerSpec> };
export function isSwipeQuestion(q: Pick<Question, 'templateVersion' | 'answerSpec'>): boolean {
  const spec = q.answerSpec as AnswerSpec | undefined;
  return q.templateVersion === SWIPE_QUESTION_VERSION && spec?.type === 'CHOICE' &&
    spec.interaction === 'SWIPE' && spec.polarity === 'PURCHASE_SUPPORT' &&
    Array.isArray(spec.options) && spec.options.length === 3 &&
    ['YES', 'UNSURE', 'NO'].every(code => spec.options?.some(o => o.code === code));
}
export const swipeAnswer = (direction: 'right' | 'up' | 'left') =>
  ({right: 'YES', up: 'UNSURE', left: 'NO'} as const)[direction];
export type ReflectionCounts = {YES: number; UNSURE: number; NO: number};
export function reflectionCounts(questions: Question[], answers: DailyAnswer[]): ReflectionCounts {
  const counts = {YES: 0, UNSURE: 0, NO: 0};
  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId);
    const code = answer.value?.choice_code;
    if (question && isSwipeQuestion(question) && (code === 'YES' || code === 'UNSURE' || code === 'NO')) counts[code]++;
  }
  return counts;
}
export function validReflectionAnswer(spec: AnswerSpec, value: ReflectionAnswer): boolean {
  if (Object.values(value).filter(v => v !== undefined).length !== 1) return false;
  if (value.choice_code !== undefined) return !!spec.options?.some(o => o.code === value.choice_code);
  if (value.number_value !== undefined) return spec.type === 'INTEGER' && Number.isInteger(value.number_value) && value.number_value >= (spec.minimum ?? 0) && value.number_value <= (spec.maximum ?? 30);
  if (value.text_value !== undefined) return spec.type === 'TEXT' && !!value.text_value.trim() && value.text_value.trim().length <= (spec.max_length ?? 300);
  if (value.object_value && spec.type === 'OBJECT' && spec.fields) return Object.keys(value.object_value).length === Object.keys(spec.fields).length && Object.entries(spec.fields).every(([key, field]) => field.options?.some(o => o.code === value.object_value![key]));
  return false;
}
