const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

const timeoutFromEnv = Number(import.meta.env.VITE_API_TIMEOUT);
const requestTimeoutMs = Number.isFinite(timeoutFromEnv) && timeoutFromEnv > 0 ? timeoutFromEnv : 30000;

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

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
  customHeaders?: Record<string, string>;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    }

    if (options.customHeaders) {
      Object.assign(headers, options.customHeaders);
    }

    const response = await fetch(`${apiBaseUrl}${withLeadingSlash(path)}`, {
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
    if (error instanceof ApiClientError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ApiClientError('Request timed out');
    throw new ApiClientError(error instanceof Error ? error.message : 'Unexpected API error');
  } finally {
    clearTimeout(timeout);
  }
}

export function apiGet<T>(path: string, accessToken?: string, customHeaders?: Record<string, string>): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', accessToken, customHeaders });
}

export function apiPost<TResponse, TBody = unknown>(path: string, body?: TBody, accessToken?: string, customHeaders?: Record<string, string>): Promise<TResponse> {
  return apiRequest<TResponse>(path, { method: 'POST', body, accessToken, customHeaders });
}

export function apiPut<TResponse, TBody = unknown>(path: string, body?: TBody, accessToken?: string, customHeaders?: Record<string, string>): Promise<TResponse> {
  return apiRequest<TResponse>(path, { method: 'PUT', body, accessToken, customHeaders });
}

export function apiDelete<TResponse>(path: string, accessToken?: string, customHeaders?: Record<string, string>): Promise<TResponse> {
  return apiRequest<TResponse>(path, { method: 'DELETE', accessToken, customHeaders });
}
