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
import type { IMerchantRepository } from '../../domain/repositories/IMerchantRepository';
import type {
  PaginatedMerchants,
  Merchant,
  MerchantDocument,
  MerchantCredential,
  MerchantCredentialCreated,
  Tenant,
  CreateMerchantPayload,
  MerchantStatusUpdate,
  MerchantVerificationUpdate,
  MerchantSettingsUpdate,
  CreateCredentialPayload,
  ListMerchantsParams
} from '../../domain/entities/Merchant';

export class MerchantRepository implements IMerchantRepository {
  async listMerchants(params: ListMerchantsParams): Promise<Either<Failure, PaginatedMerchants>> {
    try {
      const query = new URLSearchParams();
      const page  = params.page  ?? 1;
      const limit = params.limit ?? 20;
      const skip  = (page - 1) * limit;
      query.set('skip',  String(skip));
      query.set('limit', String(limit));
      if (params.status && params.status !== 'ALL')       query.set('status',       params.status);
      if (params.verification && params.verification !== 'ALL') query.set('verification', params.verification);
      if (params.search) query.set('search',       params.search);

      const url = `${API_PATHS.ADMIN_MERCHANTS}?${query.toString()}`;
      const response = await apiClient.get<PaginatedMerchants>(url);

      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async getById(id: string): Promise<Either<Failure, Merchant>> {
    try {
      const response = await apiClient.get<Merchant>(API_PATHS.ADMIN_MERCHANT(id));
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async create(payload: CreateMerchantPayload): Promise<Either<Failure, Merchant>> {
    try {
      const response = await apiClient.post<Merchant>(API_PATHS.ADMIN_MERCHANTS, payload);
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async updateStatus(id: string, payload: MerchantStatusUpdate): Promise<Either<Failure, Merchant>> {
    try {
      const response = await apiClient.put<Merchant>(API_PATHS.ADMIN_MERCHANT_STATUS(id), payload);
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async updateVerification(id: string, payload: MerchantVerificationUpdate): Promise<Either<Failure, Merchant>> {
    try {
      const response = await apiClient.put<Merchant>(API_PATHS.ADMIN_MERCHANT_VERIFICATION(id), payload);
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async updateSettings(id: string, payload: MerchantSettingsUpdate): Promise<Either<Failure, Merchant>> {
    try {
      const response = await apiClient.put<Merchant>(API_PATHS.ADMIN_MERCHANT_SETTINGS(id), payload);
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async getDocuments(id: string): Promise<Either<Failure, MerchantDocument[]>> {
    try {
      const response = await apiClient.get<MerchantDocument[]>(API_PATHS.ADMIN_MERCHANT_DOCUMENTS(id));
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async getCredentials(id: string): Promise<Either<Failure, MerchantCredential[]>> {
    try {
      const response = await apiClient.get<MerchantCredential[]>(API_PATHS.ADMIN_MERCHANT_CREDENTIALS(id));
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async createCredential(id: string, payload: CreateCredentialPayload): Promise<Either<Failure, MerchantCredentialCreated>> {
    try {
      const response = await apiClient.post<MerchantCredentialCreated>(
        API_PATHS.ADMIN_MERCHANT_CREDENTIALS(id),
        payload
      );
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }

  async listTenants(): Promise<Either<Failure, Tenant[]>> {
    try {
      const response = await apiClient.get<Tenant[]>(API_PATHS.ADMIN_TENANTS);
      if (isSuccess(response) && response.data) return right(response.data);
      if (isUnauthorized(response)) return left(new UnauthorizedFailure(response.message));
      return left(new ServerFailure(response.message, response.extendedResultCode));
    } catch {
      return left(new NetworkFailure());
    }
  }
}
