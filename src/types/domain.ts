/**
 * 도메인 모델. zod 스키마가 원본이고 타입은 여기서 추론한다.
 * 같은 스키마로 로컬 저장 데이터와 백업 파일을 검증한다.
 */
import { z } from 'zod';
import { HELP_SCOPES } from '@/config/helpFlow';

// ── 열거형 ────────────────────────────────────────────────

/** 카테고리 키 (라벨은 constants/categories.ts) */
export const CATEGORY_IDS = [
  'daily',
  'clothing',
  'furniture',
  'appliance',
  'digital',
  'hobby',
  'game',
  'beauty',
  'food',
  'etc',
] as const;
export const CategorySchema = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof CategorySchema>;

/** 구매 이유 키 (라벨은 constants/reasons.ts) — 기능 6 */
export const REASON_IDS = [
  'sns_ad',
  'discount_limited',
  'bundle_discount',
  'stress',
  'peer',
  'need',
  'long_wanted',
  /** 기타 — 직접 입력한 이유는 Item.reasonOtherText */
  'other',
] as const;
export const ReasonSchema = z.enum(REASON_IDS);
export type ReasonId = z.infer<typeof ReasonSchema>;

/** 가계부 지출 항목. 저축은 지출 항목이 아니라 별도 */
export const BUCKET_IDS = ['food', 'living', 'transport', 'discretionary'] as const;
export const BucketSchema = z.enum(BUCKET_IDS);
export type BucketId = z.infer<typeof BucketSchema>;

export const ItemSourceSchema = z.enum(['manual', 'screenshot', 'link']);
export type ItemSource = z.infer<typeof ItemSourceSchema>;

/**
 * 저장하는 상태. "결정 대기/점검 대기"는 날짜로 계산한다 (lib/calc/itemMachine)
 * 보류("조금 더 지켜볼게요 · 7일 보류")는 별도 상태 없이 시뮬레이션 기간을 연장한다 (디자인 시안)
 */
export const ItemStatusSchema = z.enum(['simulating', 'bought', 'abandoned']);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

// ── 공통 ─────────────────────────────────────────────────

/** ISO 8601 타임스탬프 */
const IsoString = z.string().min(1);
/** 로컬 기준 날짜 키 YYYY-MM-DD */
export const DateKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
/** 로컬 기준 월 키 YYYY-MM */
export const MonthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const Won = z.number().int().nonnegative();
const Id = z.string().min(1);

// ── 물품 · 시뮬레이션 (기능 1·2·3·6) ───────────────────────

/** 구매 후 점검: 지난 점검 기간 동안 며칠 썼는지 구간으로 답한다 (거의 매일 · 자주 · 가끔 · 0일) */
export const PostPurchaseReviewSchema = z.object({
  /** policy.reviewUsageBuckets의 id */
  usageBucket: z.string().min(1),
  /** 구간의 대표 일수 (계산용). 구간 정의가 바뀌어도 기록 당시 값을 유지한다 */
  usedDays: z.number().nonnegative(),
  at: IsoString,
});
export type PostPurchaseReview = z.infer<typeof PostPurchaseReviewSchema>;

export const ItemSchema = z.object({
  id: Id,
  registrationState: z.enum(['pending', 'complete']).optional(),
  remoteId: Id.optional(),
  simulationId: Id.optional(),
  purchaseId: Id.optional(),
  summary: z.object({
    text: z.string(), method: z.string(), expectedDays: z.number().nullable(),
    coverage: z.number(), eligible: z.boolean(), reason: z.string().nullable(),
    fingerprint: z.string(),
    reflectionCounts: z.object({YES: z.number().int().nonnegative(), UNSURE: z.number().int().nonnegative(), NO: z.number().int().nonnegative()}).optional(),
  }).optional(),
  name: z.string().min(1),
  price: Won,
  imageUri: z.string().optional(),
  category: CategorySchema,
  /** AI가 추천한 카테고리의 신뢰도 (사용자가 바꾸면 제거) */
  categoryConfidence: z.number().min(0).max(1).optional(),
  reasons: z.array(ReasonSchema),
  /** 이유 '기타'를 고르고 직접 적은 내용 */
  reasonOtherText: z.string().optional(),
  /** 이유 '할인·한정 판매'의 마감일 (YYYY-MM-DD) */
  saleEndsAt: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).optional(),
  /** 한 번에 등록한 묶음 (같은 쇼핑몰) — 할인 함정 확인에서 묶음 단위로 본다 */
  batchId: z.string().optional(),
  source: ItemSourceSchema,
  sourceUrl: z.string().optional(),
  status: ItemStatusSchema,
  createdAt: IsoString,
  simulation: z.object({
    startAt: IsoString,
    durationDays: z.number().int().nonnegative(),
    endDate: DateKeySchema.optional(),
    observationDates: z.array(DateKeySchema).optional(),
  }),
  /** 구매/포기를 결정한 시각 */
  decidedAt: IsoString.optional(),
  purchase: z.object({ boughtAt: IsoString, reviewStart: DateKeySchema.optional(), reviewEnd: DateKeySchema.optional() }).optional(),
  savingGoalId: Id.optional(),
  review: PostPurchaseReviewSchema.optional(),
});
export type Item = z.infer<typeof ItemSchema>;

export const QuestionOptionSchema = z.object({
  id: Id,
  label: z.string().min(1),
  /** 이 선택지를 고르면 "그날 썼다"로 센다 */
  countsAsUse: z.boolean(),
});
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

export const QuestionKindSchema = z.enum([
  'need_moment',
  'inconvenience',
  'thought_of',
  'desire_persist',
  'wish_had',
  'usage_context',
]);
export type QuestionKind = z.infer<typeof QuestionKindSchema>;

export const QuestionSchema = z.object({
  id: Id,
  itemId: Id,
  text: z.string().min(1),
  kind: QuestionKindSchema,
  /** normal: 기본 질문, recheck: 과대예측 경향이 큰 분야에서 쓰는 강한 재질문 */
  variant: z.enum(['normal', 'recheck']),
  options: z.array(QuestionOptionSchema).min(2),
  date: DateKeySchema.optional(),
  phase: z.enum(['pre', 'post']).optional(),
  templateCode: z.string().optional(),
  templateVersion: z.string().optional(),
  answerSpec: z.record(z.string(), z.unknown()).optional(),
  reference: z.string().nullish(),
  generationMethod: z.string().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

/** 물품 생성 시 질문을 만들기 위한 템플릿 (id·itemId 없음) — AI 개인화 결과도 이 형식 */
export const QuestionTemplateSchema = QuestionSchema.omit({ id: true, itemId: true }).extend({
  options: z.array(QuestionOptionSchema.omit({ id: true })).min(2),
});
export type QuestionTemplate = z.infer<typeof QuestionTemplateSchema>;

/** 물품당 하루 1개 (itemId + date 가 유일) */
export const DailyAnswerSchema = z.object({
  id: Id,
  itemId: Id,
  date: DateKeySchema,
  questionId: Id,
  optionId: Id,
  value: z.object({
    choice_code: z.string().optional(), number_value: z.number().optional(),
    text_value: z.string().optional(), object_value: z.record(z.string(), z.string()).optional(),
  }).optional(),
  label: z.string().optional(),
  at: IsoString,
});
export type DailyAnswer = z.infer<typeof DailyAnswerSchema>;

// ── 목표 · 참기 (기능 4) ──────────────────────────────────

export const GoalSchema = z.object({
  id: Id,
  name: z.string().min(1),
  price: Won,
  imageUri: z.string().optional(),
  /** 목표 물건을 나중에 다시 찾거나 구매할 때 사용할 상품 링크 */
  productUrl: z.string().optional(),
  isActive: z.boolean(),
  createdAt: IsoString,
  achievedAt: IsoString.optional(),
  /** 목표를 바꿀 때 이전 목표에서 옮겨 온 참은 금액 (명세서 4.8-1) */
  carriedAmount: Won.optional(),
  closedAt: IsoString.optional(),
  // Origin-linked allocations allow cancellation to follow transfers across goals.
  allocations: z.array(z.object({ sourceId: Id, amount: Won })).optional(),
  funding: z.object({
    startsOn: DateKeySchema,
    openingBalance: Won,
    baselineSpent: Won,
    reservedThisMonth: Won,
    frozenBalance: Won.optional(),
    frozenAllocated: Won.optional(),
    frozenOn: DateKeySchema.optional(),
  }).optional(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const ImpulseEventSchema = z.object({
  id: Id,
  cancelledAt: IsoString.optional(),
  /** 기록 당시 활성 목표 (목표가 없으면 비어 있음) */
  goalId: Id.optional(),
  label: z.string().min(1),
  amount: Won,
  decision: z.enum(['resisted', 'spent']),
  at: IsoString,
});
export type ImpulseEvent = z.infer<typeof ImpulseEventSchema>;

// ── 가계부 · 지출 원장 (기능 7) ────────────────────────────

export const ExpenseSchema = z.object({
  id: Id,
  amount: Won,
  bucket: BucketSchema,
  label: z.string().min(1),
  source: z.enum(['item', 'impulse', 'manual']),
  /** source가 item/impulse일 때 원본 id */
  refId: Id.optional(),
  at: IsoString,
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const MonthlyBudgetSchema = z.object({
  month: MonthKeySchema,
  income: Won,
  /** 식비 (야식 제외) */
  food: Won,
  /** 생활비 (월세, 관리비, 생활용품 등) */
  living: Won,
  transport: Won,
  saving: Won,
});
export type MonthlyBudget = z.infer<typeof MonthlyBudgetSchema>;

// ── 할인 함정 (기능 5) ────────────────────────────────────

/**
 * 할인 조건 (명세서 4.11 1단계: "[30,000]원 이상, [10] [% | 원] 할인").
 * 무료배송 스위치를 켜면 기준 금액, 끄면 배송비를 입력한다 (기본값은 policy.discount).
 */
export const DiscountRuleSchema = z.object({
  /** 할인을 받기 위한 최소 합계 */
  minAmount: Won,
  value: Won,
  unit: z.enum(['pct', 'won']),
  /** 무료배송 조건이 있는지 (명세서 4.11 "무료배송" 스위치, 기본 켜짐) */
  freeShipOn: z.boolean().default(true),
  /** 이 금액 이상이면 무료배송 (freeShipOn일 때만) */
  freeShipMin: Won,
  /** 무료배송이 아니면 내는 배송비 */
  shipFee: Won,
});
export type DiscountRule = z.infer<typeof DiscountRuleSchema>;

/** 장바구니 한 줄. planned=false면 할인 없이는 안 살 물건 (스위치 꺼짐) */
export const CartLineSchema = z.object({
  name: z.string().min(1),
  price: Won,
  planned: z.boolean(),
});
export type CartLine = z.infer<typeof CartLineSchema>;

// ── 설정 ─────────────────────────────────────────────────

export const SettingsSchema = z.object({
  onboarded: z.boolean(),
  helpSeen: z.array(z.enum(HELP_SCOPES)).default([]),
  /** 데모용 시간 이동 (일 단위) */
  clockOffsetDays: z.number().int(),
  /** 일평균 저축액을 직접 입력한 경우 (없으면 가계부에서 계산) */
  dailySavingOverride: Won.nullable(),
  /** null이면 시스템 설정을 따른다 */
  themeScheme: z.enum(['light', 'dark']).nullable(),
});
export type Settings = z.infer<typeof SettingsSchema>;

// ── 등록 입력 ─────────────────────────────────────────────

/** 등록 화면·AI 인식 결과 (아직 저장 전) */
export const ItemDraftSchema = z.object({
  name: z.string(),
  price: Won.optional(),
  imageUri: z.string().optional(),
  category: CategorySchema.optional(),
  categoryConfidence: z.number().min(0).max(1).optional(),
  source: ItemSourceSchema,
  sourceUrl: z.string().optional(),
  reviewFields: z.array(z.string()).optional(),
  selectionUncertain: z.boolean().optional(),
});
export type ItemDraft = z.infer<typeof ItemDraftSchema>;

/** 사용자가 확인을 끝낸 등록 입력 */
export type ConfirmedItemInput = {
  name: string;
  price: number;
  imageUri?: string;
  category: CategoryId;
  categoryConfidence?: number;
  reasons: ReasonId[];
  source: ItemSource;
  sourceUrl?: string;
  /** AI 개인화 질문 (없으면 카테고리 기본 템플릿 사용) */
  questionTemplates?: QuestionTemplate[];
  /** 같은 쇼핑몰 묶음 (addItems가 한 번 호출에 하나씩 정해 준다) */
  batchId?: string;
};
