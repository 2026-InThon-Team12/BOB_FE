/** 질문 템플릿 → 저장할 질문 */
import type { Question, QuestionTemplate } from '@/types';
import { fillName } from '@/lib/format';

/**
 * 템플릿으로 저장할 질문을 만든다.
 * - 문구의 `{name…}` 자리표시는 그대로 저장하고, 화면에 보여줄 때 questionText()로 채운다
 *   (물품 이름을 바꿔도 질문이 따라 바뀐다).
 * - normal 질문이 하나도 없으면(잘못된 AI 응답 등) 기본 템플릿으로 보충한다.
 */
export function buildQuestions(params: {
  itemId: string;
  templates: QuestionTemplate[];
  fallbackTemplates: QuestionTemplate[];
  createId: () => string;
}): Question[] {
  const { itemId, createId } = params;
  const hasNormal = params.templates.some((t) => t.variant === 'normal');
  const templates = hasNormal ? params.templates : [...params.templates, ...params.fallbackTemplates];

  return templates.map((t) => ({
    id: createId(),
    itemId,
    kind: t.kind,
    variant: t.variant,
    text: t.text,
    options: t.options.map((o) => ({ ...o, id: createId() })),
  }));
}

/** 화면에 보여줄 질문 문구 */
export const questionText = (question: Pick<Question, 'text'>, itemName: string) => fillName(question.text, itemName);
