/**
 * BE HTTP 공통 처리: 기본 주소 + /api/v1, 시간 제한, 인증 헤더, JSON·이미지 전송.
 * 금액은 원 단위 정수로 주고받는다 (BE 공유 문서).
 */
import { Platform } from 'react-native';

import { env } from '@/config/env';
import { policy } from '@/config/policy';

import { ApiError } from './errors';

export const API_PREFIX = '/api/v1';

/**
 * API 호스트만 남긴다. `/docs`는 Swagger 화면이며 API base URL이 아니다.
 * 운영 설정에 잘못 들어간 `/docs`, `/api/v1`, `/docs/api/v1`도 안전하게 보정한다.
 */
export const normalizeApiBaseUrl = (baseUrl: string) =>
  baseUrl.trim().replace(/\/+$/, '').replace(/\/api\/v1$/i, '').replace(/\/docs$/i, '');

export type ImageUpload = {
  uri: string;
  name?: string;
  mimeType?: string;
  /** 웹에서 파일 선택 시 */
  file?: Blob;
};

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  json?: unknown;
  image?: { field?: string; upload: ImageUpload };
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  /** 인증 토큰 (게스트 세션). 없으면 Authorization 헤더를 보내지 않는다 */
  token?: string | null;
};

export const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const base = `${normalizeApiBaseUrl(env.apiBaseUrl)}${API_PREFIX}${path}`;
  const params = Object.entries(query ?? {}).filter(([, v]) => v !== undefined);
  if (params.length === 0) return base;
  return `${base}?${params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`;
};

function toFormData({ field = 'image', upload }: NonNullable<RequestOptions['image']>): FormData {
  const form = new FormData();
  const name = upload.name ?? 'upload.jpg';
  const type = upload.mimeType ?? 'image/jpeg';
  if (Platform.OS === 'web' && upload.file) {
    form.append(field, upload.file, name);
  } else {
    // React Native의 FormData는 파일을 이 형태로 받는다
    form.append(field, { uri: upload.uri, name, type } as unknown as Blob);
  }
  return form;
}

/** 응답 본문은 형식이 확정되기 전이라 unknown으로 돌려준다 (호출부의 mapper가 검증) */
export async function request(opts: RequestOptions): Promise<unknown> {
  if (!env.apiBaseUrl) throw new ApiError('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았어요.', 'not_configured');

  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.image) {
    body = toFormData(opts.image);
  } else if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), policy.ai.timeoutMs);
  const url = buildUrl(opts.path, opts.query);
  let res: Response;
  try {
    res = await fetch(url, { method: opts.method, headers, body, signal: controller.signal });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(aborted ? '응답 시간이 초과됐어요.' : '네트워크 오류예요.', aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (res.ok) throw new ApiError('응답이 JSON이 아니에요.', 'invalid_response', res.status);
      data = text;
    }
  }
  if (!res.ok) throw new ApiError(`서버 오류 (${res.status}): ${url}`, 'http', res.status, data);
  return data;
}
