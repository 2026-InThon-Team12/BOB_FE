/** BE 호출 실패 (네트워크, 시간 초과, 서버 오류, 응답 형식 오류, 설정 누락) */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: 'network' | 'timeout' | 'http' | 'invalid_response' | 'not_configured',
    readonly status?: number,
    /** 서버가 보낸 오류 본문 (형식 미확정이라 그대로 보관) */
    readonly body?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}
