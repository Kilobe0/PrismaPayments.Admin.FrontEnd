export type ResponseType =
  | 'OK'
  | 'CREATED'
  | 'NO_CONTENT'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiResponse<T = unknown> {
  responseType: ResponseType;
  message: string;
  title: string;
  status: number;
  data: T | null;
  extendedResultCode: string;
  date: string;
}

export function isSuccess(response: ApiResponse<unknown>): boolean {
  return response.status === 200 || response.status === 201;
}

export function isNoContent(response: ApiResponse<unknown>): boolean {
  return response.status === 204;
}

export function isBadRequest(response: ApiResponse<unknown>): boolean {
  return response.status === 400;
}

export function isUnauthorized(response: ApiResponse<unknown>): boolean {
  return response.status === 401;
}

export function isForbidden(response: ApiResponse<unknown>): boolean {
  return response.status === 403;
}

export function isNotFound(response: ApiResponse<unknown>): boolean {
  return response.status === 404;
}

export function isServerError(response: ApiResponse<unknown>): boolean {
  return response.status >= 500;
}
