import type { Either, Failure } from '$core/error/Failure';
import type { AuthTokens } from '../entities/AdminUser';

export interface IAuthRepository {
  login(email: string, password: string): Promise<Either<Failure, AuthTokens>>;
  logout(): void;
}
