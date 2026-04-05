import type { Either, Failure } from '$core/error/Failure';
import { left, right, ServerFailure, NetworkFailure, UnauthorizedFailure } from '$core/error/Failure';
import { apiClient } from '$appmod/services/api/apiClient';
import { isSuccess, isUnauthorized } from '$appmod/services/api/apiResponse';
import { API_PATHS } from '$core/constants/apiPaths';
import type { AdminDashboardFilters, AdminDashboardResponse } from '../../domain/entities/AdminDashboardResponse';
import type { DashboardChartData, DashboardPeriod } from '../../domain/entities/DashboardSeries';

export class DashboardRepository {
  async getDashboard(filters?: AdminDashboardFilters): Promise<Either<Failure, AdminDashboardResponse>> {
    try {
      const params: Record<string, string | number | boolean | undefined | null> = {};
      if (filters) {
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
        if (filters.withdrawalStatus) params.withdrawalStatus = filters.withdrawalStatus;
        if (filters.method) params.method = filters.method;
        if (filters.currency) params.currency = filters.currency;
        if (filters.merchantId) params.merchantId = filters.merchantId;
        if (filters.merchantStatus) params.merchantStatus = filters.merchantStatus;
        if (filters.verificationStatus) params.verificationStatus = filters.verificationStatus;
        if (filters.disputeStatus) params.disputeStatus = filters.disputeStatus;
        if (filters.disputeType) params.disputeType = filters.disputeType;
        if (filters.providerName) params.providerName = filters.providerName;
        if (filters.skip != null) params.skip = filters.skip;
        if (filters.limit != null) params.limit = filters.limit;
      }

      const response = await apiClient.get<AdminDashboardResponse>(API_PATHS.DASHBOARD_ADMIN, params);

      if (isSuccess(response) && response.data) {
        return right(response.data);
      }

      if (isUnauthorized(response)) {
        return left(new UnauthorizedFailure(response.message));
      }

      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async getChartData(period: DashboardPeriod): Promise<Either<Failure, DashboardChartData>> {
    try {
      const response = await apiClient.get<DashboardChartData>(API_PATHS.DASHBOARD_ADMIN_SERIES(period));

      if (isSuccess(response) && response.data) {
        return right(response.data);
      }

      if (isUnauthorized(response)) {
        return left(new UnauthorizedFailure(response.message));
      }

      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }
}
