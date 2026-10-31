/** 잘못된 상태에서 action을 호출했을 때 (UI는 가능한 행동만 보여주므로 보통 버그다) */
export class DataError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'invalid_transition' | 'invalid_input',
  ) {
    super(message);
    this.name = 'DataError';
  }
}
