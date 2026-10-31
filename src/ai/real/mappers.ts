/**
 * 서버 응답(DTO) → 도메인 타입.
 * 백엔드 필드명·형식이 바뀌면 이 파일만 고친다. (형식은 팀원과 확정 전 초안)
 */
import { z } from 'zod';

import { CATEGORY_LABELS } from '@/constants/categories';
import {
  CATEGORY_IDS,
  DiscountRuleSchema,
  QuestionKindSchema,
  type CategoryId,
  type DiscountRule,
  type ItemDraft,
  type QuestionTemplate,
} from '@/types';

import { AiRequestError, type CategoryGuess } from '../types';

/** 카테고리는 영문 키("digital")와 한글 라벨("디지털기기") 둘 다 받는다 (팀원 확인 전) */
const LABEL_TO_ID = Object.fromEntries(Object.entries(CATEGORY_LABELS).map(([id, label]) => [label, id])) as Record<
  string,
  CategoryId
>;
export function toCategory(value: unknown): CategoryId | undefined {
  if (typeof value !== 'string') return undefined;
  if ((CATEGORY_IDS as readonly string[]).includes(value)) return value as CategoryId;
  return LABEL_TO_ID[value.trim()];
}

const Confidence = z.number().min(0).max(1).optional();
const Price = z.number().nonnegative().transform(Math.round).optional();

function parse<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new AiRequestError(`${what} 응답 형식이 달라요.`, 'invalid_response');
  return r.data;
}

const CategoryDto = z.object({ category: z.string(), confidence: Confidence });
export function mapCategory(data: unknown): CategoryGuess {
  const dto = parse(CategoryDto, data, '카테고리 인식');
  const category = toCategory(dto.category);
  return category ? { category, confidence: dto.confidence ?? 0.5 } : { category: 'etc', confidence: 0 };
}

const DraftDto = z.object({
  name: z.string(),
  price: Price,
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  confidence: Confidence,
});
const toDraft = (dto: z.infer<typeof DraftDto>, source: ItemDraft['source'], sourceUrl?: string): ItemDraft => ({
  name: dto.name.trim(),
  price: dto.price,
  imageUri: dto.imageUrl,
  category: toCategory(dto.category),
  categoryConfidence: toCategory(dto.category) ? dto.confidence : undefined,
  source,
  sourceUrl,
});

export function mapCartScreenshot(data: unknown): ItemDraft[] {
  const list = parse(z.union([z.array(DraftDto), z.object({ items: z.array(DraftDto) })]), data, '스크린샷 인식');
  return (Array.isArray(list) ? list : list.items).filter((d) => d.name.trim()).map((d) => toDraft(d, 'screenshot'));
}

export function mapLink(data: unknown, url: string): ItemDraft {
  return toDraft(parse(DraftDto, data, '링크 파싱'), 'link', url);
}

export function mapDiscountRules(data: unknown): DiscountRule {
  return parse(DiscountRuleSchema, data, '할인 조건 인식');
}

const QuestionDto = z.object({
  text: z.string().min(1),
  kind: z.string().optional(),
  variant: z.enum(['normal', 'recheck']).optional(),
  options: z.array(z.object({ label: z.string().min(1), countsAsUse: z.boolean() })).min(2),
});
export function mapQuestions(data: unknown): QuestionTemplate[] {
  const list = parse(z.union([z.array(QuestionDto), z.object({ questions: z.array(QuestionDto) })]), data, '질문 생성');
  return (Array.isArray(list) ? list : list.questions).map((q) => {
    const kind = QuestionKindSchema.safeParse(q.kind);
    return {
      text: q.text,
      kind: kind.success ? kind.data : 'need_moment',
      variant: q.variant ?? 'normal',
      options: q.options,
    };
  });
}
