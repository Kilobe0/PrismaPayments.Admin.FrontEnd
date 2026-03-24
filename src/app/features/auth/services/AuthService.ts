import type { Either, Failure } from '$core/error/Failure';
import { left, ValidationFailure } from '$core/error/Failure';
import { tokenStorage } from '$appmod/services/storage/tokenStorage';
import type { IAuthRepository } from '../domain/repositories/IAuthRepository';
import { validateLogin, hasErrors } from '../validators/authValidator';

export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  async login(email: string, password: string): Promise<Either<Failure, void>> {
    const errors = validateLogin(email, password);
    if (hasErrors(errors)) {
      const firstError = Object.values(errors)[0]!;
      return left(new ValidationFailure(firstError));
    }

    const result = await this.repo.login(email, password);
    if (!result.ok) return result;

    tokenStorage.setTokens(result.value.accessToken, result.value.refreshToken);
    return { ok: true, value: undefined };
  }

  logout(): void {
    tokenStorage.clearTokens();
  }

  isAuthenticated(): boolean {
    return tokenStorage.getAccessToken() !== null;
  }
}
