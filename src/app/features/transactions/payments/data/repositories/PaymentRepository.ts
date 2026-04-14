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
import type { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import type {
  PaginatedPayments,
  Payment,
  ListPaymentsParams
} from '../../domain/entities/Payment';

export class PaymentRepository implements IPaymentRepository {
  async listPayments(params: ListPaymentsParams): Promise<Either<Failure, PaginatedPayments>> {
    try {
      const query = new URLSearchParams();
      const page  = params.page  ?? 1;
      const limit = params.limit ?? 20;
      const skip  = (page - 1) * limit;
      query.set('skip',  String(skip));
      query.set('limit', String(limit));
      if (params.merchantId) query.set('merchantId', params.merchantId);
      if (params.status)     query.set('status',     params.status);
      if (params.method)     query.set('method',     params.method);

      const url = `${API_PATHS.ADMIN_PAYMENTS}?${query.toString()}`;
      const response = await apiClient.get<PaginatedPayments>(url);

      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async getById(id: string): Promise<Either<Failure, Payment>> {
    try {
      const response = await apiClient.get<Payment>(API_PATHS.ADMIN_PAYMENT(id));
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }
}
