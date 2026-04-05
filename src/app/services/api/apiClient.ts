import { env } from '$core/config/env';
import { API_PATHS } from '$core/constants/apiPaths';
import type { ApiResponse } from './apiResponse';
import { tokenStorage } from '../storage/tokenStorage';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  _isRetry?: boolean;    // flag interna — previne loop de refresh
  _retryCount?: number;  // flag interna — controla retries em 429
}

// Módulo-level state — singleton compartilhado por todas as requisições
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const refreshController = new AbortController();
    const refreshTimeoutId = setTimeout(() => refreshController.abort(), 10000);
    const res = await fetch(`${env.apiBaseUrl}${API_PATHS.AUTH_REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-secret': env.clientSecret
      },
      body: JSON.stringify({ refreshToken }),
      signal: refreshController.signal
    });
    clearTimeout(refreshTimeoutId);
    const body = await res.json() as ApiResponse<{ accessToken: string; refreshToken: string; expiresIn?: number }>;
    if ((body.status === 200 || body.status === 201) && body.data?.accessToken) {
      tokenStorage.setTokens(body.data.accessToken, body.data.refreshToken);
      // Sincroniza cookie HttpOnly no servidor (fire-and-forget)
      fetch('/api/internal/sync-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: body.data.accessToken })
      }).catch(() => {/* ignorar falhas de sync — SSR ainda funciona até próxima navegação */});
      return body.data.accessToken;
    }
  } catch {
    // falha de rede durante refresh
  }
  return null;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params, skipAuth = false, _isRetry = false } = options;

  let url = `${env.apiBaseUrl}${path}`;
  if (params) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) url += `?${query}`;
  }

  const headers: Record<string, string> = {
    'client-secret': env.clientSecret
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {

    console.log(`[apiClient] ${method} ${url}`);
    response = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body as FormData : JSON.stringify(body)) : undefined,
      signal: controller.signal
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    return {
      responseType: 'INTERNAL_SERVER_ERROR',
      message: isTimeout
        ? 'O servidor demorou demais para responder. Tente novamente.'
        : 'Falha de rede. Verifique sua conexão.',
      title: isTimeout ? 'Timeout' : 'Erro de rede',
      status: 0,
      data: null,
      extendedResultCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      date: new Date().toISOString()
    } as ApiResponse<T>;
  } finally {
    clearTimeout(timeoutId);
  }

  let data: ApiResponse<T>;
  try {
    data = await response.json() as ApiResponse<T>;
  } catch {
    return {
      responseType: 'INTERNAL_SERVER_ERROR',
      message: 'Falha ao conectar. Tente novamente.',
      title: 'Erro de resposta',
      status: response.status,
      data: null,
      extendedResultCode: 'PARSE_ERROR',
      date: new Date().toISOString()
    } as ApiResponse<T>;
  }

  // Interceptor de 429: retry automático para requests secundários (pequenos delays)
  // Não espera mais que 10s para não travar a UX do usuário
  if (response.status === 429) {
    const retryCount = options._retryCount ?? 0;
    if (retryCount < 2) {
      // Lê o header de reset (em segundos) — mas limita a 10s para não travar a UX
      const resetHeader = response.headers.get('x-ratelimit-reset') ||
                          response.headers.get('Retry-After');
      const rawWait = resetHeader ? parseInt(resetHeader, 10) : 5;
      const waitSeconds = Math.min(rawWait, 10); // máx 10s de espera silenciosa
      console.warn(`[apiClient] 429 Rate Limit — aguardando ${waitSeconds}s antes de retentar (tentativa ${retryCount + 1}/2)`);
      await new Promise<void>(r => setTimeout(r, waitSeconds * 1000));
      return request<T>(path, { ...options, _retryCount: retryCount + 1 });
    }
    // Esgotou retries — retorna o erro 429 normalmente
    return {
      responseType: 'INTERNAL_SERVER_ERROR',
      message: 'Muitas requisições. Tente novamente em breve.',
      title: 'Limite atingido',
      status: 429,
      data: null,
      extendedResultCode: 'TOO_MANY_REQUESTS',
      date: new Date().toISOString()
    } as ApiResponse<T>;
  }

  // Interceptor de refresh: apenas para requisições autenticadas não-retry
  if (response.status === 401 && !skipAuth && !_isRetry) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      // Resolver todas as requisições enfileiradas
      refreshQueue.forEach(cb => cb(newToken));
      refreshQueue = [];

      if (newToken) {
        return request<T>(path, { ...options, _isRetry: true });
      } else {
        // Refresh falhou — logout completo
        tokenStorage.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return data;
      }
    } else {
      // Já está fazendo refresh — enfileirar
      return new Promise<ApiResponse<T>>(resolve => {
        refreshQueue.push(async (token) => {
          if (token) {
            resolve(await request<T>(path, { ...options, _isRetry: true }));
          } else {
            resolve(data);
          }
        });
      });
    }
  }

  return data;
}

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params']) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),

  delete: <T>(path: string, params?: RequestOptions['params']) =>
    request<T>(path, { method: 'DELETE', params }),

  postPublic: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body, skipAuth: true })
};
