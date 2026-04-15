import axios, { AxiosError, type AxiosInstance } from 'axios';
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

const http: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 25000,
  validateStatus: () => true, // Gerencia todos os status manualmente, como fetch
});

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn?: number }>>(
      `${env.apiBaseUrl}${API_PATHS.AUTH_REFRESH}`,
      { refreshToken },
      {
        timeout: 10000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json',
          'client-secret': env.clientSecret
        }
      }
    );
    const body = res.data;
    if ((body.status === 200 || body.status === 201) && body.data?.accessToken) {
      tokenStorage.setTokens(body.data.accessToken, body.data.refreshToken);
      // Sincroniza cookie HttpOnly no servidor (fire-and-forget)
      axios.post('/api/internal/sync-token', { accessToken: body.data.accessToken })
        .catch(() => {/* ignorar falhas de sync — SSR ainda funciona até próxima navegação */});
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

  const cleanParams = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
    : undefined;

  const headers: Record<string, string> = {
    'client-secret': env.clientSecret
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  // Para FormData, axios define Content-Type com boundary automaticamente

  if (!skipAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    console.log(`[apiClient] ${method} ${env.apiBaseUrl}${path}`);
    res = await http.request<ApiResponse<T>>({
      method,
      url: path,
      params: cleanParams,
      data: body,
      headers
    });
  } catch (err) {
    const isTimeout = err instanceof AxiosError && err.code === 'ECONNABORTED';
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
  }

  // Resposta com body inválido (ex: HTML de erro 500 do servidor)
  if (!res.data || typeof res.data !== 'object') {
    return {
      responseType: 'INTERNAL_SERVER_ERROR',
      message: 'Falha ao conectar. Tente novamente.',
      title: 'Erro de resposta',
      status: res.status,
      data: null,
      extendedResultCode: 'PARSE_ERROR',
      date: new Date().toISOString()
    } as ApiResponse<T>;
  }

  const data = res.data;

  // Interceptor de 429: retry automático para requests secundários (pequenos delays)
  // Não espera mais que 10s para não travar a UX do usuário
  if (res.status === 429) {
    const retryCount = options._retryCount ?? 0;
    if (retryCount < 2) {
      const resetHeader = res.headers['x-ratelimit-reset'] ?? res.headers['retry-after'];
      const rawWait = resetHeader ? parseInt(String(resetHeader), 10) : 5;
      const waitSeconds = Math.min(rawWait, 10); // máx 10s de espera silenciosa
      console.warn(`[apiClient] 429 Rate Limit — aguardando ${waitSeconds}s antes de retentar (tentativa ${retryCount + 1}/2)`);
      await new Promise<void>(r => setTimeout(r, waitSeconds * 1000));
      return request<T>(path, { ...options, _retryCount: retryCount + 1 });
    }
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
  if (res.status === 401 && !skipAuth && !_isRetry) {
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
