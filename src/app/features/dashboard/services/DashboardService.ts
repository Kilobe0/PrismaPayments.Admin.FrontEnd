import type { Either, Failure } from '$core/error/Failure';
import type { DashboardRepository } from '../data/repositories/DashboardRepository';
import type { AdminMetrics } from '../domain/entities/AdminMetrics';
import type { DashboardChartData, DashboardPeriod } from '../domain/entities/DashboardSeries';

export class DashboardService {
  constructor(private readonly repo: DashboardRepository) {}

  async getMetrics(): Promise<Either<Failure, AdminMetrics>> {
    return this.repo.getMetrics();
  }

  async getChartData(period: DashboardPeriod): Promise<Either<Failure, DashboardChartData>> {
    return this.repo.getChartData(period);
  }
}
