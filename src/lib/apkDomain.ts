/** BOB_ANDROID Domain.kt contract. Server owns items and financial calculations. */
import { cropImageUri } from './imageCrop';
export type Json = Record<string, unknown>;
export const object = (v: unknown): Json =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {};
export const rows = (v: unknown): Json[] => (Array.isArray(v) ? v.map(object) : []);
export const str = (v: unknown): string => (v == null ? '' : String(v));
export const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
export const seoulDate = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
export const validMoney = (v: unknown, positive = true) =>
  /^\d+$/.test(str(v)) &&
  Number.isSafeInteger(Number(v)) &&
  Number(v) >= (positive ? 1 : 0) &&
  Number(v) <= 1e12;
export const validDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export type Draft = {
  name: string;
  price: string;
  category: string;
  source: string;
  source_url: string;
  image_url: string;
  crop: string;
  reasons: string[];
  other: string;
  deadline: string;
  needed: boolean;
};
export const newDraft = (input: Json = {}): Draft => ({
  name: str(input.name),
  price: str(input.price),
  category: str(input.category) || 'OTHER',
  source: str(input.source) || 'MANUAL',
  source_url: str(input.source_url),
  image_url: str(input.image_url),
  crop: cropImageUri(input.image_crop) ?? '',
  reasons: [],
  other: '',
  deadline: '',
  needed: true,
});
export const validDraft = (d: Draft) =>
  !!d.name.trim() &&
  d.name.length <= 200 &&
  validMoney(d.price) &&
  d.reasons.length > 0 &&
  (!d.reasons.includes('OTHER') || (d.other.trim().length > 0 && d.other.trim().length <= 300)) &&
  (!d.reasons.includes('DISCOUNT_LIMITED') || (validDate(d.deadline) && d.deadline >= seoulDate()));
export const draftPayload = (d: Draft): Json => ({
  name: d.name.trim(),
  price: Number(d.price),
  category: d.category,
  source: d.source,
  question_mode: 'LOCAL',
  purchase_reasons: [...d.reasons].sort(),
  ...(d.source_url ? { source_url: d.source_url } : {}),
  ...(d.image_url.startsWith('https://') ? { image_url: d.image_url } : {}),
  ...(d.reasons.includes('OTHER') ? { reason_other_text: d.other.trim() } : {}),
  ...(d.reasons.includes('DISCOUNT_LIMITED') ? { sale_ends_on: d.deadline } : {}),
});
export type Task = {
  kind: 'simulations' | 'purchases';
  subjectId: string;
  name: string;
  date: string;
};
export const questionTasks = (today: Json): Task[] => [
  ...rows(today.pre_purchase_questions).map((q): Task => ({
    kind: 'simulations',
    subjectId: str(q.simulation_id),
    name: str(q.name ?? q.item_name),
    date: str(today.date),
  })),
  ...rows(today.purchase_questions).map((q): Task => ({
    kind: 'purchases',
    subjectId: str(q.purchase_id),
    name: str(q.name ?? q.item_name),
    date: str(today.date),
  })),
];
export const taskKey = (t: Task) => `${t.kind}:${t.subjectId}:${t.date}`;
export function validAnswer(spec: Json, answer: Json): boolean {
  const keys = ['choice_code', 'number_value', 'text_value', 'object_value'].filter((k) => answer[k] != null);
  if (keys.length !== 1) return false;
  switch (keys[0]) {
    case 'choice_code':
      return rows(spec.options).some((o) => o.code === answer.choice_code);
    case 'number_value':
      return (
        spec.type === 'INTEGER' &&
        Number.isInteger(answer.number_value) &&
        num(answer.number_value) >= num(spec.minimum) &&
        num(answer.number_value) <= num(spec.maximum)
      );
    case 'text_value':
      return (
        spec.type === 'TEXT' &&
        str(answer.text_value).trim().length > 0 &&
        str(answer.text_value).trim().length <= num(spec.max_length ?? 300)
      );
    case 'object_value': {
      const fields = object(spec.fields),
        values = object(answer.object_value);
      return (
        spec.type === 'OBJECT' &&
        Object.keys(fields).length === Object.keys(values).length &&
        Object.keys(fields).every((k) => rows(object(fields[k]).options).some((o) => o.code === values[k]))
      );
    }
    default:
      return false;
  }
}
export function answerLabel(q: Json): string {
  const a = object(q.answer),
    spec = object(q.answer_spec);
  if (a.choice_code != null)
    return str(rows(spec.options).find((o) => o.code === a.choice_code)?.label ?? a.choice_code);
  if (a.number_value != null) return str(a.number_value) + (spec.unit === 'KRW' ? '원' : '일');
  if (a.text_value != null) return str(a.text_value);
  return Object.entries(object(a.object_value))
    .map(([k, v]) => str(rows(object(object(spec.fields)[k]).options).find((o) => o.code === v)?.label ?? v))
    .join(' · ');
}
export const apkBackPage: Record<string, string> = {
  question: 'today',
  review: 'today',
  reasons: 'drafts',
  discount: 'reasons',
  registrationPreview: 'reasons',
  drafts: 'add',
  goalSetup: 'goal',
  shelf: 'goal',
  impulse: 'goal',
};
