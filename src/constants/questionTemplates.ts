/**
 * 오늘의 질문 템플릿 (기능 1).
 * - 답은 항상 3개: 있었어요 · 딱히 없었어요 · 잘 모르겠어요
 *   (디자인 시안: 오른쪽 스와이프 = 있었어요, 왼쪽 = 딱히 없었어요, 위 = 잘 모르겠어요)
 * - 사용 의향이 아니라 오늘 실제로 있었던 상황을 묻는다.
 * - AI가 없거나 실패하면 이 템플릿으로 질문을 만든다. AI 맞춤 질문도 이 형식 안에서만 문구를 바꾼다.
 * - `{name}`은 물품 이름으로, `{name이/가}`·`{name을/를}`은 받침에 맞는 조사까지 붙여 바뀐다.
 */
import type { CategoryId, QuestionOption, QuestionTemplate } from '@/types';

type OptionTemplate = Omit<QuestionOption, 'id'>;

/** 답 3개 — 순서는 스와이프 방향(오른쪽 · 왼쪽 · 위)과 같다 */
export const DEFAULT_OPTIONS: OptionTemplate[] = [
  { label: '있었어요', countsAsUse: true },
  { label: '딱히 없었어요', countsAsUse: false },
  { label: '잘 모르겠어요', countsAsUse: false },
];

const q = (
  kind: QuestionTemplate['kind'],
  text: string,
  variant: QuestionTemplate['variant'] = 'normal',
): QuestionTemplate => ({ kind, text, options: DEFAULT_OPTIONS, variant });

/** 모든 카테고리 공통 질문 (정의서의 질문 목록) */
export const BASE_QUESTIONS: QuestionTemplate[] = [
  q('wish_had', '오늘 {name이/가} 있었으면 좋겠다고 느낀 순간이 있었나요?'),
  q('need_moment', '오늘 {name이/가} 정말 필요하다고 느낀 순간이 있었나요?'),
  q('inconvenience', '오늘 {name이/가} 없어서 불편했던 순간이 있었나요?'),
];

/** 카테고리별 상황 질문 (시안 예: "오늘 이 코트를 입고 나가고 싶었던 순간이 있었나요?") */
export const CATEGORY_QUESTIONS: Partial<Record<CategoryId, QuestionTemplate[]>> = {
  clothing: [q('usage_context', '오늘 {name을/를} 입고 나가고 싶었던 순간이 있었나요?')],
  digital: [q('usage_context', '오늘 {name이/가} 있었다면 바로 꺼내 썼을 순간이 있었나요?')],
  appliance: [q('usage_context', '오늘 집안일을 하다가 {name이/가} 아쉬웠던 순간이 있었나요?')],
  furniture: [q('usage_context', '오늘 집에서 {name이/가} 있었으면 했던 순간이 있었나요?')],
  hobby: [q('usage_context', '오늘 {name을/를} 꺼내 쓸 만한 시간이 실제로 있었나요?')],
  game: [q('usage_context', '오늘 {name을/를} 30분 이상 할 시간이 있었나요?')],
  beauty: [q('usage_context', '오늘 외출 준비나 관리를 하다가 {name이/가} 아쉬웠던 순간이 있었나요?')],
  food: [q('usage_context', '오늘 {name이/가} 있었다면 실제로 먹었을 순간이 있었나요?')],
};

/** 과대예측 경향이 큰 분야에서 쓰는 재질문 */
export const RECHECK_QUESTIONS: QuestionTemplate[] = [
  q('need_moment', '오늘 {name이/가} 꼭 필요했던 순간이 실제로 있었나요?', 'recheck'),
  q('inconvenience', '솔직하게요! 오늘 {name이/가} 없어서 실제로 곤란했던 일이 있었나요?', 'recheck'),
];

/** 카테고리 기본 질문 세트 (normal + recheck) */
export function defaultQuestionTemplates(category: CategoryId): QuestionTemplate[] {
  return [...(CATEGORY_QUESTIONS[category] ?? []), ...BASE_QUESTIONS, ...RECHECK_QUESTIONS];
}
