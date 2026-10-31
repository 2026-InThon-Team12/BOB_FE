/**
 * AI 서비스 진입점. 앱 코드는 이 파일의 `ai`만 쓴다 (ESLint로 강제).
 *
 * - EXPO_PUBLIC_AI_MODE=mock → 명시적 데모 응답
 * - 기본(real) → 팀원 서버. 사진 실패는 원래 오류를 화면에 전달
 */
import { env } from '@/config/env';

import { fallbackAi } from './fallback';
import { mockAi } from './mock';
import { realAi } from './real';
import type { AiService } from './types';

/** 로컬 처리가 가능한 기능만 대체한다. 사진은 원격 오류를 그대로 전달한다. */
export function withFallback(primary: AiService, fallback: AiService): AiService {
  const attempt = async <T>(key: keyof AiService, run: () => Promise<T>, backup: () => Promise<T>) => {
    try {
      return await run();
    } catch (e) {
      console.warn(`[ai] ${key} 실패 → 로컬 대체`, e);
      return backup();
    }
  };
  return {
    classifyCategory: (input) =>
      attempt('classifyCategory', () => primary.classifyCategory(input), () => fallback.classifyCategory(input)),
    parseCartScreenshot: (image) => primary.parseCartScreenshot(image),
    parseLink: (url) => primary.parseLink(url),
    parseDiscountRules: (image) =>
      attempt(
        'parseDiscountRules',
        () => primary.parseDiscountRules(image),
        () => fallback.parseDiscountRules(image),
      ),
    personalizeQuestions: (input) =>
      attempt(
        'personalizeQuestions',
        () => primary.personalizeQuestions(input),
        () => fallback.personalizeQuestions(input),
      ),
  };
}

export const ai: AiService = env.aiMode === 'real' ? withFallback(realAi, fallbackAi) : mockAi;

export {
  AiRequestError,
  AiUnavailableError,
  type AiService,
  type CartScreenshotAnalysis,
  type CategoryGuess,
  type ImageInput,
} from './types';
