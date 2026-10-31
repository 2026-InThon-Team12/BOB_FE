import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query는 원격 AI 호출에만 쓴다 (도메인 데이터는 @/data 로컬 스토어).
 * AI 실패는 ai/index의 fallback이 처리하므로 Query 단에서는 재시도하지 않는다.
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
