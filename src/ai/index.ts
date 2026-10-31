/**
 * AI 서비스 진입점. 앱 코드는 이 파일의 `ai`만 쓴다 (ESLint로 강제).
 *
 * - EXPO_PUBLIC_AI_MODE=mock(기본) → mock 응답
 * - EXPO_PUBLIC_AI_MODE=real → 팀원 서버. 실패하면 자동으로 로컬 fallback
 */
import { env } from '@/config/env';

import { fallbackAi } from './fallback';
import { mockAi } from './mock';
import { realAi } from './real';
import type { AiService } from './types';

/** primary가 실패하면 fallback을 호출하는 서비스를 만든다 */
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
    parseCartScreenshot: (image) =>
      attempt('parseCartScreenshot', () => primary.parseCartScreenshot(image), () => fallback.parseCartScreenshot(image)),
    parseLink: (url) => attempt('parseLink', () => primary.parseLink(url), () => fallback.parseLink(url)),
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
