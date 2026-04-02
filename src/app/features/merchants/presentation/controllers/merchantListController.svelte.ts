import { MerchantService } from '$appmod/features/merchants/services/MerchantService';
import { MerchantRepository } from '$appmod/features/merchants/data/repositories/MerchantRepository';
import type {
  MerchantListItem,
  MerchantStatus,
  VerificationStatus,
  ListMerchantsParams
} from '$appmod/features/merchants/domain/entities/Merchant';

interface MerchantListState {
  merchants: MerchantListItem[];
  total: number;
  page: number;
  limit: number;
  status: MerchantStatus | 'ALL';
  verification: VerificationStatus | 'ALL';
  search: string;
  loading: boolean;
  error: string | null;
  pendingKYCCount: number;
  // Counts por status para as tabs
  counts: Record<string, number>;
}

export function createMerchantListController() {
  const service = new MerchantService(new MerchantRepository());

  let state = $state<MerchantListState>({
    merchants: [],
    total: 0,
    page: 1,
    limit: 20,
    status: 'ALL',
    verification: 'ALL',
    search: '',
    loading: true,
    error: null,
    pendingKYCCount: 0,
    counts: {}
  });

  async function loadMerchants() {
    state.loading = true;
    state.error = null;

    const params: ListMerchantsParams = {
      page: state.page,
      limit: state.limit
    };
    if (state.status !== 'ALL')       params.status = state.status;
    if (state.verification !== 'ALL') params.verification = state.verification;
    if (state.search.trim())          params.search = state.search.trim();

    const result = await service.listMerchants(params);
    if (result.ok) {
      state.merchants = result.value.data;
      state.total = result.value.total;
    } else {
      state.error = result.failure.message;
    }
    state.loading = false;
  }

  async function loadPendingKYCCount() {
    const result = await service.getPendingKYCCount();
    if (result.ok) state.pendingKYCCount = result.value;
  }

  // Carrega contagens individuais por status para exibir nas tabs
  // Faz 4 requests paralelos com limit=1, usando apenas o campo `total` da resposta
  async function loadCounts() {
    const statuses: MerchantStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED'];
    const results = await Promise.all(
      statuses.map(s => service.listMerchants({ page: 1, limit: 1, status: s }))
    );
    results.forEach((res, i) => {
      if (res.ok) state.counts[statuses[i]] = res.value.total;
    });
  }

  function setStatus(s: MerchantStatus | 'ALL') {
    state.status = s;
    state.page = 1;
    loadMerchants();
  }

  function setVerification(v: VerificationStatus | 'ALL') {
    state.verification = v;
    state.page = 1;
    loadMerchants();
  }

  function setSearch(s: string) {
    state.search = s;
    state.page = 1;
    loadMerchants();
  }

  function setPage(p: number) {
    state.page = p;
    loadMerchants();
  }

  return {
    get state() { return state; },
    loadMerchants,
    loadPendingKYCCount,
    loadCounts,
    setStatus,
    setVerification,
    setSearch,
    setPage
  };
}
