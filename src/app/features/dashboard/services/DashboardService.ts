import type { Either, Failure } from '$core/error/Failure';
import type { DashboardRepository } from '../data/repositories/DashboardRepository';
import type { AdminMetrics } from '../domain/entities/AdminMetrics';

export class DashboardService {
  constructor(private readonly repo: DashboardRepository) {}

  async getMetrics(): Promise<Either<Failure, AdminMetrics>> {
    return this.repo.getMetrics();
  }
}
