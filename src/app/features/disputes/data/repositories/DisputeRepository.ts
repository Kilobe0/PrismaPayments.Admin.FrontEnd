import type { Either, Failure } from '$core/error/Failure';
import { left, right, ServerFailure, NetworkFailure, UnauthorizedFailure } from '$core/error/Failure';
import { apiClient } from '$appmod/services/api/apiClient';
import { isSuccess, isUnauthorized } from '$appmod/services/api/apiResponse';
import { API_PATHS } from '$core/constants/apiPaths';
import type { IDisputeRepository } from '../../domain/repositories/IDisputeRepository';
import type { Dispute, PaginatedDisputes, ListDisputesParams, ResolveDisputePayload } from '../../domain/entities/Dispute';

export class DisputeRepository implements IDisputeRepository {
  async listDisputes(params: ListDisputesParams): Promise<Either<Failure, PaginatedDisputes>> {
    try {
      const query = new URLSearchParams();
      const page  = params.page  ?? 1;
      const limit = params.limit ?? 20;
      query.set('skip',  String((page - 1) * limit));
      query.set('limit', String(limit));
      if (params.status)      query.set('status',      params.status);
      if (params.disputeType) query.set('disputeType', params.disputeType);
      if (params.merchantId)  query.set('merchantId',  params.merchantId);

      const url = `${API_PATHS.ADMIN_DISPUTES}?${query.toString()}`;
      const response = await apiClient.get<unknown>(url);

      if (isSuccess(response) && response.data) {
        // Handle both array response (docs §5.6.1 shows {data:[...]}) and paginated envelope
        const raw = response.data as unknown;
        const items = Array.isArray(raw)
          ? (raw as Dispute[])
          : (raw as PaginatedDisputes).items ?? [];
        const total = Array.isArray(raw)
          ? items.length
          : (raw as PaginatedDisputes).total ?? items.length;
        return right({ items, total, skip: (page - 1) * limit, limit });
      }
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async getById(id: string): Promise<Either<Failure, Dispute>> {
    try {
      const response = await apiClient.get<Dispute>(API_PATHS.ADMIN_DISPUTE(id));
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async resolveDispute(id: string, payload: ResolveDisputePayload): Promise<Either<Failure, Dispute>> {
    try {
      const response = await apiClient.put<Dispute>(API_PATHS.ADMIN_DISPUTE(id), payload);
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }
}
