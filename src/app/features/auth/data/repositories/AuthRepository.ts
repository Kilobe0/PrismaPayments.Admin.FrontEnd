import type { Either, Failure } from '$core/error/Failure';
import {
  left, right,
  ValidationFailure,
  ServerFailure,
  NetworkFailure
} from '$core/error/Failure';
import { apiClient } from '$appmod/services/api/apiClient';
import { isSuccess, isUnauthorized, isBadRequest } from '$appmod/services/api/apiResponse';
import { API_PATHS } from '$core/constants/apiPaths';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { AuthTokens } from '../../domain/entities/AdminUser';

export class AuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<Either<Failure, AuthTokens>> {
    try {
      const response = await apiClient.postPublic<AuthTokens>(
        API_PATHS.AUTH_ADMIN_LOGIN,
        { email, password }
      );

      if (isSuccess(response) && response.data) {
        return right(response.data);
      }

      if (isUnauthorized(response) || isBadRequest(response)) {
        return left(new ValidationFailure(response.message));
      }

      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  logout(): void {
    // Stateless — token clearing handled by tokenStorage
  }
}
