import type { Either, Failure } from '$core/error/Failure';
import {
  left,
  right,
  ServerFailure,
  NetworkFailure,
  UnauthorizedFailure
} from '$core/error/Failure';
import { apiClient } from '$appmod/services/api/apiClient';
import { isSuccess, isUnauthorized } from '$appmod/services/api/apiResponse';
import { API_PATHS } from '$core/constants/apiPaths';
import type { IWithdrawalRepository } from '../../domain/repositories/IWithdrawalRepository';
import type {
  PaginatedWithdrawals,
  Withdrawal,
  ListWithdrawalsParams
} from '../../domain/entities/Withdrawal';

export class WithdrawalRepository implements IWithdrawalRepository {
  async listWithdrawals(params: ListWithdrawalsParams): Promise<Either<Failure, PaginatedWithdrawals>> {
    try {
      const query = new URLSearchParams();
      const page  = params.page  ?? 1;
      const limit = params.limit ?? 20;
      const skip  = (page - 1) * limit;
      query.set('skip',  String(skip));
      query.set('limit', String(limit));
      if (params.merchantId) query.set('merchantId', params.merchantId);
      if (params.status)     query.set('status',     params.status);

      const url = `${API_PATHS.ADMIN_WITHDRAWALS}?${query.toString()}`;
      const response = await apiClient.get<PaginatedWithdrawals>(url);

      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async getById(id: string): Promise<Either<Failure, Withdrawal>> {
    try {
      const response = await apiClient.get<Withdrawal>(API_PATHS.ADMIN_WITHDRAWAL(id));
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }
}
