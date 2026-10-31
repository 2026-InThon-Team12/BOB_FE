import type { DailyAnswer } from '@/types';
export type ReflectionAnswer = NonNullable<DailyAnswer['value']>;
export type AnswerSpec = { type: string; unit?: string; options?: {code: string; label: string; value?: number}[]; minimum?: number; maximum?: number; max_length?: number; fields?: Record<string, AnswerSpec> };
export function validReflectionAnswer(spec: AnswerSpec, value: ReflectionAnswer): boolean {
  if (Object.values(value).filter(v => v !== undefined).length !== 1) return false;
  if (value.choice_code !== undefined) return !!spec.options?.some(o => o.code === value.choice_code);
  if (value.number_value !== undefined) return spec.type === 'INTEGER' && Number.isInteger(value.number_value) && value.number_value >= (spec.minimum ?? 0) && value.number_value <= (spec.maximum ?? 30);
  if (value.text_value !== undefined) return spec.type === 'TEXT' && !!value.text_value.trim() && value.text_value.trim().length <= (spec.max_length ?? 300);
  if (value.object_value && spec.type === 'OBJECT' && spec.fields) return Object.keys(value.object_value).length === Object.keys(spec.fields).length && Object.entries(spec.fields).every(([key, field]) => field.options?.some(o => o.code === value.object_value![key]));
  return false;
}
