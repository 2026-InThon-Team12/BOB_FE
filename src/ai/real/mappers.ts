/** 서버 OpenAPI 응답(DTO) → 앱 도메인 타입. */
import { z } from 'zod';

import { CATEGORY_LABELS } from '@/constants/categories';
import { cropImageUri } from '@/lib/imageCrop';
import {
  CATEGORY_IDS,
  DiscountRuleSchema,
  QuestionKindSchema,
  type CategoryId,
  type DiscountRule,
  type ItemDraft,
  type QuestionTemplate,
} from '@/types';

import { AiRequestError, type CartScreenshotAnalysis, type CategoryGuess } from '../types';

/**
 * 서버 Category enum을 앱의 CategoryId로 바꾼다.
 * 이전 개발 응답(앱 키·한글 라벨)도 받아 로컬/구버전 서버와 호환한다.
 */
const API_CATEGORY_TO_ID: Record<string, CategoryId> = {
  DAILY_LIVING: 'daily',
  CLOTHING: 'clothing',
  FURNITURE: 'furniture',
  APPLIANCES: 'appliance',
  DIGITAL: 'digital',
  HOBBY: 'hobby',
  GAME: 'game',
  BEAUTY: 'beauty',
  FOOD: 'food',
  OTHER: 'etc',
};
const LABEL_TO_ID = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([id, label]) => [label, id]),
) as Record<string, CategoryId>;
export function toCategory(value: unknown): CategoryId | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if ((CATEGORY_IDS as readonly string[]).includes(normalized)) return normalized as CategoryId;
  return API_CATEGORY_TO_ID[normalized] ?? LABEL_TO_ID[normalized];
}

const Confidence = z.number().min(0).max(1).optional();
const Price = z
  .number()
  .positive()
  .transform(Math.round)
  .nullish()
  .transform((value) => value ?? undefined);

function parse<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new AiRequestError(`${what} 응답 형식이 달라요.`, 'invalid_response');
  return r.data;
}

const DraftDto = z.object({
  name: z.string(),
  price: Price,
  category: z.string().optional(),
  supplemental_question: z.string().optional(),
  source: z.enum(['MANUAL', 'SCREENSHOT', 'URL', 'SHARE']).optional(),
  source_url: z.string().nullish(),
  image_url: z.string().nullish(),
  image_crop: z.record(z.string(), z.unknown()).nullish(),
  category_source: z.enum(['AI', 'FALLBACK']).optional(),
  simulation_days: z.number().int().positive().nullish(),
  // 구버전/개발 서버 응답 호환
  confidence: Confidence,
  imageUrl: z.string().optional(),
});

const DraftAnalysisDto = z.object({
  items: z.array(DraftDto).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
  analysis_method: z.enum(['text', 'vision', 'ocr', 'manual']),
});

const CategoryDto = z.object({ category: z.string(), confidence: Confidence });
export function mapCategory(data: unknown): CategoryGuess {
  const analysis = DraftAnalysisDto.safeParse(data);
  const dto = analysis.success ? analysis.data.items[0] : parse(CategoryDto, data, '카테고리 인식');
  if (!dto) throw new AiRequestError('카테고리 인식 결과가 비어 있어요.', 'invalid_response');
  const category = toCategory(dto.category);
  const confidence = 'confidence' in dto ? dto.confidence : undefined;
  return category ? { category, confidence: confidence ?? 0.5 } : { category: 'etc', confidence: 0 };
}

const toDraft = (
  dto: z.infer<typeof DraftDto>,
  source: ItemDraft['source'],
  sourceUrl?: string,
): ItemDraft => ({
  name: dto.name.trim(),
  price: dto.price,
  imageUri: dto.image_url ?? dto.imageUrl ?? cropImageUri(dto.image_crop),
  category: toCategory(dto.category),
  // OpenAPI에는 confidence가 없으므로, AI 추천 표시를 위한 중립값을 사용한다.
  categoryConfidence: toCategory(dto.category) ? (dto.confidence ?? 0.5) : undefined,
  source,
  sourceUrl: dto.source_url ?? sourceUrl,
});

export function mapCartScreenshot(data: unknown): CartScreenshotAnalysis {
  const result = parse(DraftAnalysisDto, data, '스크린샷 인식');
  return {
    items: result.items.filter((d) => d.name.trim()).map((d) => toDraft(d, 'screenshot')),
    warnings: result.warnings,
    analysisMethod: result.analysis_method,
  };
}

export function mapLink(data: unknown, url: string): ItemDraft {
  const analysis = DraftAnalysisDto.safeParse(data);
  const dto = analysis.success ? analysis.data.items[0] : parse(DraftDto, data, '링크 파싱');
  if (!dto) throw new AiRequestError('링크 인식 결과가 비어 있어요.', 'invalid_response');
  return toDraft(dto, 'link', url);
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
  const list = parse(
    z.union([z.array(QuestionDto), z.object({ questions: z.array(QuestionDto) })]),
    data,
    '질문 생성',
  );
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
