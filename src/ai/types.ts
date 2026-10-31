/**
 * AI 서비스 계약. 상태를 저장하지 않는 호출만 있다 (입력 → 결과).
 * 팀원과 확정할 입출력 초안: 팀원_확인사항.md 1-2.
 */
import type { CategoryId, DiscountRule, ItemDraft, QuestionTemplate, ReasonId } from '@/types';

/** 이미지 입력. 웹은 file(Blob)이, 네이티브는 uri가 있다 */
export type ImageInput = {
  uri: string;
  name?: string;
  mimeType?: string;
  file?: Blob;
};

export type CategoryGuess = { category: CategoryId; confidence: number };

export interface AiService {
  classifyCategory(input: { name: string; price?: number }): Promise<CategoryGuess>;
  /** 장바구니 스크린샷 → 품목 목록 (기능 3) */
  parseCartScreenshot(image: ImageInput): Promise<ItemDraft[]>;
  /** 상품 링크 → 품목 (OG 파싱, 웹은 서버 프록시 필요) */
  parseLink(url: string): Promise<ItemDraft>;
  /** 할인 조건 스크린샷 → 조건 (기능 5, 예: 3만 원 이상 10% 할인) */
  parseDiscountRules(image: ImageInput): Promise<DiscountRule>;
  /** 물품별 질문 개인화 (기능 1). 템플릿 형식 안에서만 */
  personalizeQuestions(input: {
    name: string;
    price: number;
    category: CategoryId;
    reasons: ReasonId[];
  }): Promise<QuestionTemplate[]>;
}

/**
 * AI를 쓸 수 없음 — 화면은 직접 입력으로 전환한다.
 * (fallback 구현이 인식 기능에서 던진다)
 */
export class AiUnavailableError extends Error {
  constructor(readonly feature: keyof AiService) {
    super(`AI 기능을 쓸 수 없어요: ${feature}`);
    this.name = 'AiUnavailableError';
  }
}

/** 원격 호출 실패 (네트워크, 시간 초과, 서버 오류, 응답 형식 오류) */
export class AiRequestError extends Error {
  constructor(
    message: string,
    readonly code: 'network' | 'timeout' | 'http' | 'invalid_response' | 'not_configured',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AiRequestError';
  }
}
