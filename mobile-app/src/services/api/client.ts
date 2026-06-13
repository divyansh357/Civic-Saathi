import { API_CONFIG } from '@constants/index';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string;
  extraHeaders?: Record<string, string>;
}

export class ApiClientError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

const withLeadingSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

const resolveUrl = (path: string): string => `${API_CONFIG.baseUrl}${withLeadingSlash(path)}`;

/** Returns true when the base URL is a localtunnel host (*.loca.lt). */
const isTunnelUrl = (): boolean => API_CONFIG.baseUrl.includes('.loca.lt');

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Bypass the localtunnel browser-challenge interstitial page.
    // Without this header, loca.lt serves an HTML gate instead of the API response.
    if (isTunnelUrl()) {
      headers['bypass-tunnel-reminder'] = 'true';
    }

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    }

    if (options.extraHeaders) {
      Object.assign(headers, options.extraHeaders);
    }

    const response = await fetch(resolveUrl(path), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    const raw = await response.text();
    let payload: unknown;

    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    }

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : `Request failed with status ${response.status}`;

      throw new ApiClientError(message, response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('Request timed out');
    }

    throw new ApiClientError(error instanceof Error ? error.message : 'Unexpected API error');
  } finally {
    clearTimeout(timeoutId);
  }
}

export function apiGet<T>(path: string, accessToken?: string): Promise<T> {
  return request<T>(path, { method: 'GET', accessToken });
}

export function apiGetWithHeaders<T>(
  path: string,
  accessToken?: string,
  extraHeaders?: Record<string, string>
): Promise<T> {
  return request<T>(path, { method: 'GET', accessToken, extraHeaders });
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  accessToken?: string
): Promise<TResponse> {
  return request<TResponse>(path, { method: 'POST', body, accessToken });
}

export function apiPostWithHeaders<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  accessToken?: string,
  extraHeaders?: Record<string, string>
): Promise<TResponse> {
  return request<TResponse>(path, { method: 'POST', body, accessToken, extraHeaders });
}

export function apiPut<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  accessToken?: string
): Promise<TResponse> {
  return request<TResponse>(path, { method: 'PUT', body, accessToken });
}

export function apiPutWithHeaders<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  accessToken?: string,
  extraHeaders?: Record<string, string>
): Promise<TResponse> {
  return request<TResponse>(path, { method: 'PUT', body, accessToken, extraHeaders });
}

export function apiDelete<TResponse>(
  path: string,
  accessToken?: string
): Promise<TResponse> {
  return request<TResponse>(path, { method: 'DELETE', accessToken });
}

