import type { Either, Failure } from '$core/error/Failure';
import { left, right, ServerFailure, NetworkFailure, UnauthorizedFailure } from '$core/error/Failure';
import { apiClient } from '$appmod/services/api/apiClient';
import { isSuccess, isUnauthorized } from '$appmod/services/api/apiResponse';
import { API_PATHS } from '$core/constants/apiPaths';
import type { AdminMetrics } from '../../domain/entities/AdminMetrics';
import type { DashboardChartData, DashboardPeriod } from '../../domain/entities/DashboardSeries';

export class DashboardRepository {
  async getMetrics(): Promise<Either<Failure, AdminMetrics>> {
    try {
      const response = await apiClient.get<AdminMetrics>(API_PATHS.DASHBOARD_ADMIN);

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
