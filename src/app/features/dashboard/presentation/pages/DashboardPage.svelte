<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  } from 'chart.js';
  import { Bar } from 'svelte5-chartjs';
  import {
    AlertTriangle,
    Clock,
    TrendingUp,
    Wallet,
    Hourglass,
    Receipt,
    CreditCard,
    Store,
    ShieldAlert,
    ScanFace,
    Filter,
    ChevronDown,
    ChevronUp,
    RotateCcw
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import DateRangeFilter from '$appmod/shared/widgets/filters/DateRangeFilter.svelte';
  import SelectFilter from '$appmod/shared/widgets/filters/SelectFilter.svelte';
  import Pagination from '$appmod/shared/widgets/Pagination.svelte';
  import { DashboardService } from '../../services/DashboardService';
  import { DashboardRepository } from '../../data/repositories/DashboardRepository';
  import { formatCurrency, formatDate } from '$appmod/shared/utils/formatters';
  import type {
    AdminDashboardResponse,
    AdminDashboardFilters,
    PaymentStatus,
    PaymentMethod
  } from '../../domain/entities/AdminDashboardResponse';
  import type { DashboardChartData, DashboardPeriod } from '../../domain/entities/DashboardSeries';

  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

  // ── State ───────────────────────────────────────────
  let dashboard = $state<AdminDashboardResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let activePeriod = $state<DashboardPeriod>('today');
  let chartData = $state<DashboardChartData | null>(null);
  let chartLoading = $state(false);

  let filtersOpen = $state(false);
  let activeDataTab = $state('payments');

  // ── Filtros ─────────────────────────────────────────
  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  };

  let filterStartDate = $state(defaultStartDate());
  let filterEndDate = $state('');
  let filterPaymentStatus = $state('');
  let filterMethod = $state('');
  let filterMerchantId = $state('');
  let filterMerchantStatus = $state('');
  let filterDisputeStatus = $state('');
  let filterProviderName = $state('');

  // ── Paginação por tab ───────────────────────────────
  const PAGE_SIZE = 20;
  let paymentsSkip = $state(0);
  let withdrawalsSkip = $state(0);
  let disputesSkip = $state(0);
  let merchantsSkip = $state(0);
  let webhooksSkip = $state(0);

  const service = new DashboardService(new DashboardRepository());

  // ── Helpers ─────────────────────────────────────────
  function buildFilters(): AdminDashboardFilters {
    const f: AdminDashboardFilters = {};
    if (filterStartDate) f.startDate = filterStartDate;
    if (filterEndDate) f.endDate = filterEndDate;
    if (filterPaymentStatus) f.paymentStatus = filterPaymentStatus as PaymentStatus;
    if (filterMethod) f.method = filterMethod as PaymentMethod;
    if (filterMerchantId) f.merchantId = filterMerchantId;
    if (filterMerchantStatus) f.merchantStatus = filterMerchantStatus as AdminDashboardFilters['merchantStatus'];
    if (filterDisputeStatus) f.disputeStatus = filterDisputeStatus;
    if (filterProviderName) f.providerName = filterProviderName;

    // Paginação baseada na tab ativa
    const skipMap: Record<string, number> = {
      payments: paymentsSkip,
      withdrawals: withdrawalsSkip,
      disputes: disputesSkip,
      merchants: merchantsSkip,
      webhooks: webhooksSkip
    };
    f.skip = skipMap[activeDataTab] ?? 0;
    f.limit = PAGE_SIZE;
    return f;
  }

  async function fetchDashboard() {
    loading = true;
    error = null;
    const result = await service.getDashboard(buildFilters());
    if (result.ok) {
      dashboard = result.value;
    } else {
      error = result.failure.message;
    }
    loading = false;
  }

  function resetFilters() {
    filterStartDate = defaultStartDate();
    filterEndDate = '';
    filterPaymentStatus = '';
    filterMethod = '';
    filterMerchantId = '';
    filterMerchantStatus = '';
    filterDisputeStatus = '';
    filterProviderName = '';
    resetAllPagination();
    fetchDashboard();
  }

  function applyFilters() {
    resetAllPagination();
    fetchDashboard();
  }

  function resetAllPagination() {
    paymentsSkip = 0;
    withdrawalsSkip = 0;
    disputesSkip = 0;
    merchantsSkip = 0;
    webhooksSkip = 0;
  }

  // Paginação: ao mudar página de uma tab, re-fetch
  function changePage(tab: string, direction: 'prev' | 'next') {
    const delta = direction === 'next' ? PAGE_SIZE : -PAGE_SIZE;
    if (tab === 'payments') paymentsSkip = Math.max(0, paymentsSkip + delta);
    else if (tab === 'withdrawals') withdrawalsSkip = Math.max(0, withdrawalsSkip + delta);
    else if (tab === 'disputes') disputesSkip = Math.max(0, disputesSkip + delta);
    else if (tab === 'merchants') merchantsSkip = Math.max(0, merchantsSkip + delta);
    else if (tab === 'webhooks') webhooksSkip = Math.max(0, webhooksSkip + delta);
    fetchDashboard();
  }

  function currentSkip(tab: string): number {
    const map: Record<string, number> = {
      payments: paymentsSkip,
      withdrawals: withdrawalsSkip,
      disputes: disputesSkip,
      merchants: merchantsSkip,
      webhooks: webhooksSkip
    };
    return map[tab] ?? 0;
  }

  // ── Status badge helpers ────────────────────────────
  function paymentStatusVariant(s: string) {
    if (s === 'PAID') return 'success';
    if (s === 'FAILED') return 'destructive';
    if (s === 'REFUNDED' || s === 'CANCELLED') return 'outline';
    if (s === 'PENDING' || s === 'CREATED') return 'warning';
    return 'secondary';
  }

  function withdrawalStatusVariant(s: string) {
    if (s === 'COMPLETED') return 'success';
    if (s === 'FAILED') return 'destructive';
    return 'warning';
  }

  function disputeStatusVariant(s: string) {
    if (s === 'OPEN') return 'destructive';
    if (s === 'UNDER_REVIEW') return 'warning';
    return 'secondary';
  }

  function merchantStatusVariant(s: string) {
    if (s === 'ACTIVE') return 'success';
    if (s === 'SUSPENDED') return 'destructive';
    return 'warning';
  }

  // ── Filter options ──────────────────────────────────
  const paymentStatusOptions = [
    { value: 'PAID', label: 'Pago' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'FAILED', label: 'Falhou' },
    { value: 'PROCESSING', label: 'Processando' },
    { value: 'CREATED', label: 'Criado' },
    { value: 'REFUNDED', label: 'Reembolsado' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  const methodOptions = [
    { value: 'PIX', label: 'PIX' },
    { value: 'BOLETO', label: 'Boleto' },
    { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
    { value: 'DEBIT_CARD', label: 'Cartão de Débito' }
  ];

  const merchantStatusOptions = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'SUSPENDED', label: 'Suspenso' }
  ];

  const disputeStatusOptions = [
    { value: 'OPEN', label: 'Aberto' },
    { value: 'UNDER_REVIEW', label: 'Em revisão' },
    { value: 'RESOLVED', label: 'Resolvido' },
    { value: 'CLOSED', label: 'Fechado' }
  ];

  // ── Lifecycle ───────────────────────────────────────
  onMount(() => {
    fetchDashboard();
  });

  // Chart
  $effect(() => {
    const period = activePeriod;
    chartLoading = true;
    chartData = null;
    service.getChartData(period).then((result) => {
      if (result.ok) {
        chartData = result.value;
      }
      chartLoading = false;
    });
  });

  const PERIODS: { key: DashboardPeriod; label: string }[] = [
    { key: 'today',  label: 'Hoje' },
    { key: 'week',   label: 'Semana' },
    { key: 'month',  label: 'Mês' },
    { key: 'year',   label: 'Ano' }
  ];

  const barChartData = $derived(chartData ? {
    labels: chartData.points.map(p => p.label),
    datasets: [
      {
        label: 'Volume (R$)',
        data: chartData.points.map(p => p.volume / 100),
        backgroundColor: 'rgba(1, 250, 251, 0.08)',
        borderColor: 'rgba(1, 250, 251, 0.40)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(1, 250, 251, 0.14)',
        hoverBorderColor: 'rgba(1, 250, 251, 0.65)'
      }
    ]
  } : { labels: [], datasets: [] });

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F0F18',
        borderColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        titleColor: '#F6F6FF',
        bodyColor: '#9090A8',
        padding: 12,
        cornerRadius: 10,
        titleFont: { family: 'Outfit', size: 13, weight: 600 },
        bodyFont:  { family: 'Outfit', size: 12 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#3A3A50', font: { family: 'Outfit', size: 11 } },
        border: { color: 'rgba(255,255,255,0.06)' }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#3A3A50', font: { family: 'Outfit', size: 11 } },
        border: { color: 'rgba(255,255,255,0.06)' }
      }
    }
  };

  // ── Derived counters from new response ──────────────
  const openDisputes = $derived(dashboard?.disputes?.open ?? 0);
  const pendingMerchants = $derived(dashboard?.merchants?.pending ?? 0);
</script>

<div class="page">
  <!-- Header -->
  <div class="page-header anim-1">
    <div>
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Visão geral da plataforma</p>
    </div>
    <button
      type="button"
      class="filter-toggle"
      onclick={() => (filtersOpen = !filtersOpen)}
    >
      <Filter size={15} strokeWidth={1.5} />
      <span>Filtros</span>
      {#if filtersOpen}
        <ChevronUp size={14} strokeWidth={1.5} />
      {:else}
        <ChevronDown size={14} strokeWidth={1.5} />
      {/if}
    </button>
  </div>

  <!-- Filter bar -->
  {#if filtersOpen}
    <div class="filter-bar anim-1">
      <div class="filter-row">
        <DateRangeFilter
          value={{ from: filterStartDate, to: filterEndDate }}
          onChange={(r) => { filterStartDate = r.from; filterEndDate = r.to; }}
        />
        <SelectFilter
          options={paymentStatusOptions}
          value={filterPaymentStatus}
          placeholder="Status pagamento"
          onChange={(v) => (filterPaymentStatus = v)}
        />
        <SelectFilter
          options={methodOptions}
          value={filterMethod}
          placeholder="Método"
          onChange={(v) => (filterMethod = v)}
        />
      </div>
      <div class="filter-row">
        <SelectFilter
          options={merchantStatusOptions}
          value={filterMerchantStatus}
          placeholder="Status merchant"
          onChange={(v) => (filterMerchantStatus = v)}
        />
        <SelectFilter
          options={disputeStatusOptions}
          value={filterDisputeStatus}
          placeholder="Status disputa"
          onChange={(v) => (filterDisputeStatus = v)}
        />
        <div class="filter-actions">
          <Button variant="outline" size="sm" onclick={resetFilters}>
            <RotateCcw size={14} strokeWidth={1.5} />
            Limpar
          </Button>
          <Button size="sm" onclick={applyFilters}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Alert banners -->
  {#if !loading && dashboard && (openDisputes > 0 || pendingMerchants > 0)}
    <div class="alerts anim-2">
      {#if openDisputes > 0}
        <button
          type="button"
          class="alert-card alert-danger"
          onclick={() => goto('/disputes')}
        >
          <AlertTriangle size={15} strokeWidth={1.5} />
          <span class="alert-label">Disputas abertas</span>
          <span class="alert-count">{openDisputes}</span>
        </button>
      {/if}
      {#if pendingMerchants > 0}
        <button
          type="button"
          class="alert-card alert-warn"
          onclick={() => goto('/merchants?verification=PENDING_REVIEW')}
        >
          <Clock size={15} strokeWidth={1.5} />
          <span class="alert-label">Merchants pendentes</span>
          <span class="alert-count">{pendingMerchants}</span>
        </button>
      {/if}
    </div>
  {/if}

  <!-- ── Financeiro ── -->
  <p class="section-label anim-2">Financeiro</p>
  <div class="metrics-grid anim-2">
    {#if loading}
      {#each Array(4) as _}
        <div class="metric-card">
          <div class="sk-icon"></div>
          <div class="sk-label"></div>
          <div class="sk-value"></div>
        </div>
      {/each}
    {:else if dashboard}
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--cyan">
          <TrendingUp size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Volume pagamentos</span>
        <span class="metric-value">{formatCurrency(dashboard.payments.volume)}</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--green">
          <Wallet size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Pagos</span>
        <span class="metric-value">{dashboard.payments.paid.toLocaleString('pt-BR')}</span>
        <span class="metric-sub">{dashboard.payments.total.toLocaleString('pt-BR')} no total</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--muted">
          <Hourglass size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Processando</span>
        <span class="metric-value metric-value--muted">{dashboard.payments.processing.toLocaleString('pt-BR')}</span>
      </div>
      <div class="metric-card {dashboard.payments.failed > 0 ? 'metric-card--danger' : ''}">
        <div class="metric-icon-wrap {dashboard.payments.failed > 0 ? 'metric-icon--danger' : 'metric-icon--purple'}">
          <Receipt size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Falhos</span>
        <span class="metric-value {dashboard.payments.failed > 0 ? 'metric-value--danger' : ''}">{dashboard.payments.failed.toLocaleString('pt-BR')}</span>
      </div>
    {/if}
  </div>

  <!-- ── Operacional ── -->
  <p class="section-label anim-3">Operacional</p>
  <div class="metrics-grid anim-3">
    {#if loading}
      {#each Array(4) as _}
        <div class="metric-card">
          <div class="sk-icon"></div>
          <div class="sk-label"></div>
          <div class="sk-value"></div>
        </div>
      {/each}
    {:else if dashboard}
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--cyan">
          <CreditCard size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Saques</span>
        <span class="metric-value">{dashboard.withdrawals.total.toLocaleString('pt-BR')}</span>
        <span class="metric-sub">Volume hoje: {formatCurrency(dashboard.withdrawals.todayVolume)}</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--cyan">
          <Store size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Merchants</span>
        <span class="metric-value">{dashboard.merchants.total.toLocaleString('pt-BR')}</span>
        <span class="metric-sub">{dashboard.merchants.active.toLocaleString('pt-BR')} ativos</span>
      </div>
      <div class="metric-card {openDisputes > 0 ? 'metric-card--danger' : ''}">
        <div class="metric-icon-wrap {openDisputes > 0 ? 'metric-icon--danger' : 'metric-icon--muted'}">
          <ShieldAlert size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Disputas abertas</span>
        <span class="metric-value {openDisputes > 0 ? 'metric-value--danger' : ''}">{openDisputes}</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--muted">
          <ScanFace size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Webhook failures</span>
        <span class="metric-value">{dashboard.webhookFailures.total.toLocaleString('pt-BR')}</span>
      </div>
    {/if}
  </div>

  <!-- ── Chart ── -->
  <div class="chart-panel anim-4">
    <div class="chart-accent" aria-hidden="true"></div>
    <div class="chart-header">
      <div>
        <p class="chart-title">Volume de transações</p>
        <p class="chart-subtitle">Evolução por período selecionado</p>
      </div>
      <Tabs bind:value={activePeriod} class="chart-tabs">
        <TabsList>
          {#each PERIODS as p}
            <TabsTrigger value={p.key}>{p.label}</TabsTrigger>
          {/each}
        </TabsList>
      </Tabs>
    </div>

    {#if chartLoading}
      <div class="chart-skeleton-wrap">
        {#each [55, 75, 90, 60, 80, 45, 70] as h}
          <div class="chart-skeleton-bar" style="height: {h}%"></div>
        {/each}
      </div>
    {:else if chartData && chartData.points.length > 0}
      <div class="chart-area">
        <Bar data={barChartData} options={barChartOptions} />
      </div>
    {:else}
      <div class="chart-empty">
        <span>Sem dados para o período</span>
      </div>
    {/if}
  </div>

  <!-- ── Data tables ── -->
  {#if !loading && dashboard}
    <div class="data-panel anim-4">
      <div class="data-accent" aria-hidden="true"></div>
      <Tabs bind:value={activeDataTab}>
        <TabsList class="data-tabs-list">
          <TabsTrigger value="payments">
            Pagamentos
            <Badge variant="secondary" class="ml-1.5">{dashboard.payments.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Saques
            <Badge variant="secondary" class="ml-1.5">{dashboard.withdrawals.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Disputas
            {#if openDisputes > 0}
              <Badge variant="destructive" class="ml-1.5">{dashboard.disputes.total}</Badge>
            {:else}
              <Badge variant="secondary" class="ml-1.5">{dashboard.disputes.total}</Badge>
            {/if}
          </TabsTrigger>
          <TabsTrigger value="merchants">
            Merchants
            <Badge variant="secondary" class="ml-1.5">{dashboard.merchants.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            Webhooks
            <Badge variant="secondary" class="ml-1.5">{dashboard.webhookFailures.total}</Badge>
          </TabsTrigger>
        </TabsList>

        <!-- Payments tab -->
        <TabsContent value="payments">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Merchant</th>
                  <th>Valor</th>
                  <th>Método</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Pago em</th>
                </tr>
              </thead>
              <tbody>
                {#each dashboard.payments.items as item}
                  <tr>
                    <td class="td-mono">{item.id.slice(0, 8)}...</td>
                    <td class="td-mono">{item.merchantId ? item.merchantId.slice(0, 8) + '...' : '—'}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td><Badge variant="outline">{item.method}</Badge></td>
                    <td><Badge variant={paymentStatusVariant(item.status)}>{item.status}</Badge></td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{formatDate(item.paidAt)}</td>
                  </tr>
                {:else}
                  <tr><td colspan="7" class="td-empty">Nenhum pagamento encontrado</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <span class="pagination-info">Exibindo {paymentsSkip + 1}–{paymentsSkip + dashboard.payments.items.length}</span>
            <div class="pagination-btns">
              <Button variant="outline" size="sm" disabled={paymentsSkip === 0} onclick={() => changePage('payments', 'prev')}>← Anterior</Button>
              <Button variant="outline" size="sm" disabled={dashboard.payments.items.length < PAGE_SIZE} onclick={() => changePage('payments', 'next')}>Próximo →</Button>
            </div>
          </div>
        </TabsContent>

        <!-- Withdrawals tab -->
        <TabsContent value="withdrawals">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Merchant</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Concluído em</th>
                </tr>
              </thead>
              <tbody>
                {#each dashboard.withdrawals.items as item}
                  <tr>
                    <td class="td-mono">{item.id.slice(0, 8)}...</td>
                    <td class="td-mono">{item.merchantId ? item.merchantId.slice(0, 8) + '...' : '—'}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td><Badge variant={withdrawalStatusVariant(item.status)}>{item.status}</Badge></td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>{formatDate(item.completedAt)}</td>
                  </tr>
                {:else}
                  <tr><td colspan="6" class="td-empty">Nenhum saque encontrado</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <span class="pagination-info">Exibindo {withdrawalsSkip + 1}–{withdrawalsSkip + dashboard.withdrawals.items.length}</span>
            <div class="pagination-btns">
              <Button variant="outline" size="sm" disabled={withdrawalsSkip === 0} onclick={() => changePage('withdrawals', 'prev')}>← Anterior</Button>
              <Button variant="outline" size="sm" disabled={dashboard.withdrawals.items.length < PAGE_SIZE} onclick={() => changePage('withdrawals', 'next')}>Próximo →</Button>
            </div>
          </div>
        </TabsContent>

        <!-- Disputes tab -->
        <TabsContent value="disputes">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Payment</th>
                  <th>Merchant</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Aberta em</th>
                </tr>
              </thead>
              <tbody>
                {#each dashboard.disputes.items as item}
                  <tr>
                    <td class="td-mono">{item.id.slice(0, 8)}...</td>
                    <td class="td-mono">{item.paymentId.slice(0, 8)}...</td>
                    <td class="td-mono">{item.merchantId.slice(0, 8)}...</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td><Badge variant="outline">{item.disputeType}</Badge></td>
                    <td><Badge variant={disputeStatusVariant(item.status)}>{item.status}</Badge></td>
                    <td>{formatDate(item.openedAt)}</td>
                  </tr>
                {:else}
                  <tr><td colspan="7" class="td-empty">Nenhuma disputa encontrada</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <span class="pagination-info">Exibindo {disputesSkip + 1}–{disputesSkip + dashboard.disputes.items.length}</span>
            <div class="pagination-btns">
              <Button variant="outline" size="sm" disabled={disputesSkip === 0} onclick={() => changePage('disputes', 'prev')}>← Anterior</Button>
              <Button variant="outline" size="sm" disabled={dashboard.disputes.items.length < PAGE_SIZE} onclick={() => changePage('disputes', 'next')}>Próximo →</Button>
            </div>
          </div>
        </TabsContent>

        <!-- Merchants tab -->
        <TabsContent value="merchants">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tenant</th>
                  <th>Nome fantasia</th>
                  <th>Status</th>
                  <th>Verificação</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {#each dashboard.merchants.items as item}
                  <tr class="tr-clickable" onclick={() => goto(`/merchants/${item.id}`)}>
                    <td class="td-mono">{item.id.slice(0, 8)}...</td>
                    <td class="td-mono">{item.tenantId.slice(0, 8)}...</td>
                    <td>{item.tradeName}</td>
                    <td><Badge variant={merchantStatusVariant(item.status)}>{item.status}</Badge></td>
                    <td><Badge variant={item.verificationStatus === 'PENDING_REVIEW' ? 'warning' : 'secondary'}>{item.verificationStatus}</Badge></td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                {:else}
                  <tr><td colspan="6" class="td-empty">Nenhum merchant encontrado</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <span class="pagination-info">Exibindo {merchantsSkip + 1}–{merchantsSkip + dashboard.merchants.items.length}</span>
            <div class="pagination-btns">
              <Button variant="outline" size="sm" disabled={merchantsSkip === 0} onclick={() => changePage('merchants', 'prev')}>← Anterior</Button>
              <Button variant="outline" size="sm" disabled={dashboard.merchants.items.length < PAGE_SIZE} onclick={() => changePage('merchants', 'next')}>Próximo →</Button>
            </div>
          </div>
        </TabsContent>

        <!-- Webhook failures tab -->
        <TabsContent value="webhooks">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Merchant</th>
                  <th>Evento</th>
                  <th>HTTP Status</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {#each dashboard.webhookFailures.items as item}
                  <tr>
                    <td class="td-mono">{item.id.slice(0, 8)}...</td>
                    <td class="td-mono">{item.merchantId.slice(0, 8)}...</td>
                    <td><Badge variant="outline">{item.eventType}</Badge></td>
                    <td><Badge variant={item.responseStatus >= 500 ? 'destructive' : 'warning'}>{item.responseStatus}</Badge></td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                {:else}
                  <tr><td colspan="5" class="td-empty">Nenhuma falha encontrada</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <span class="pagination-info">Exibindo {webhooksSkip + 1}–{webhooksSkip + dashboard.webhookFailures.items.length}</span>
            <div class="pagination-btns">
              <Button variant="outline" size="sm" disabled={webhooksSkip === 0} onclick={() => changePage('webhooks', 'prev')}>← Anterior</Button>
              <Button variant="outline" size="sm" disabled={dashboard.webhookFailures.items.length < PAGE_SIZE} onclick={() => changePage('webhooks', 'next')}>Próximo →</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  {/if}
</div>

<style>
  /* ── Page layout ─────────────────────────────────────── */
  .page {
    padding: 32px 36px;
    max-width: 1120px;
    margin: 0 auto;
  }
  @keyframes page-enter {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-1 { animation: page-enter 0.40s cubic-bezier(0.22, 1, 0.36, 1)   0ms both; }
  .anim-2 { animation: page-enter 0.40s cubic-bezier(0.22, 1, 0.36, 1)  80ms both; }
  .anim-3 { animation: page-enter 0.40s cubic-bezier(0.22, 1, 0.36, 1) 160ms both; }
  .anim-4 { animation: page-enter 0.40s cubic-bezier(0.22, 1, 0.36, 1) 240ms both; }

  /* ── Header ──────────────────────────────────────────── */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 16px;
  }

  .page-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #F6F6FF;
    margin: 0 0 4px;
    text-transform: uppercase;
  }
  .page-subtitle {
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9090A8;
    margin: 0;
  }

  /* ── Filter toggle ───────────────────────────────────── */
  .filter-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: #0F0F18;
    color: #9090A8;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .filter-toggle:hover {
    border-color: rgba(255, 255, 255, 0.15);
    color: #F6F6FF;
  }

  /* ── Filter bar ──────────────────────────────────────── */
  .filter-bar {
    background: #0F0F18;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .filter-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  /* ── Alert banners ───────────────────────────────────── */
  .alerts {
    display: flex;
    gap: 10px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .alert-card {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 12px;
    cursor: pointer;
    border: 1px solid;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.15s, transform 0.15s;
  }
  .alert-card:hover  { transform: translateY(-1px); }
  .alert-card:active { transform: scale(0.96); }

  .alert-danger {
    background: rgba(255, 59, 92, 0.07);
    border-color: rgba(255, 59, 92, 0.25);
    color: #FF3B5C;
  }
  .alert-danger:hover { background: rgba(255, 59, 92, 0.12); }

  .alert-warn {
    background: rgba(255, 179, 0, 0.07);
    border-color: rgba(255, 179, 0, 0.25);
    color: #FFB300;
  }
  .alert-warn:hover { background: rgba(255, 179, 0, 0.12); }

  .alert-label { flex: 1; }
  .alert-count {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0;
  }

  /* ── Section label ───────────────────────────────────── */
  .section-label {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #3A3A50;
    margin: 0 0 12px;
  }

  /* ── Metrics grid ────────────────────────────────────── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }

  .metric-card {
    position: relative;
    background: #0F0F18;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 0.18s, transform 0.18s;
  }
  .metric-card:hover {
    border-color: rgba(255, 255, 255, 0.13);
    transform: translateY(-1px);
  }
  .metric-card--danger { border-color: rgba(255, 59, 92, 0.22); }

  /* ── Icon containers ──────────────────────────────────── */
  .metric-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
    flex-shrink: 0;
  }
  .metric-icon--cyan   { background: rgba(1, 250, 251, 0.08);  border: 1px solid rgba(1, 250, 251, 0.15);  color: #01FAFB; }
  .metric-icon--green  { background: rgba(0, 230, 118, 0.08);  border: 1px solid rgba(0, 230, 118, 0.15);  color: #00E676; }
  .metric-icon--purple { background: rgba(114, 34, 131, 0.12); border: 1px solid rgba(114, 34, 131, 0.25); color: #8B2A9E; }
  .metric-icon--muted  { background: rgba(58, 58, 80, 0.30);   border: 1px solid rgba(58, 58, 80, 0.50);   color: #9090A8; }
  .metric-icon--danger { background: rgba(255, 59, 92, 0.08);  border: 1px solid rgba(255, 59, 92, 0.18);  color: #FF3B5C; }

  /* ── Metric text ─────────────────────────────────────── */
  .metric-label {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9090A8;
    line-height: 1;
  }
  .metric-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #F6F6FF;
    letter-spacing: 0.01em;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }
  .metric-value--muted  { color: #9090A8; }
  .metric-value--danger { color: #FF3B5C; }

  .metric-sub {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    color: #3A3A50;
    letter-spacing: 0.02em;
    margin-top: -2px;
  }

  /* ── Skeleton ────────────────────────────────────────── */
  .sk-icon, .sk-label, .sk-value {
    background: #141420;
    border-radius: 8px;
    animation: sk-pulse 1.6s ease-in-out infinite;
  }
  .sk-icon  { width: 36px; height: 36px; border-radius: 10px; margin-bottom: 4px; }
  .sk-label { width: 80px;  height: 11px; border-radius: 4px; }
  .sk-value { width: 110px; height: 22px; border-radius: 6px; }
  @keyframes sk-pulse {
    0%, 100% { opacity: 0.30; }
    50%       { opacity: 0.65; }
  }

  /* ── Chart panel ─────────────────────────────────────── */
  .chart-panel {
    position: relative;
    background: #0F0F18;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    padding: 24px;
    overflow: hidden;
    margin-bottom: 24px;
  }

  .chart-accent, .data-accent {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(1, 250, 251, 0.45) 30%,
      rgba(114, 34, 131, 0.55) 60%,
      transparent 100%
    );
    border-radius: 16px 16px 0 0;
  }

  .chart-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
  }
  .chart-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #F6F6FF;
    margin: 0 0 4px;
    letter-spacing: 0.01em;
  }
  .chart-subtitle {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    color: #9090A8;
    margin: 0;
    letter-spacing: 0.04em;
  }
  :global(.chart-tabs) { gap: 0 !important; }

  .chart-area {
    height: 260px;
    position: relative;
  }

  .chart-skeleton-wrap {
    height: 260px;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 0 4px;
  }
  .chart-skeleton-bar {
    flex: 1;
    background: #141420;
    border-radius: 6px 6px 0 0;
    animation: sk-pulse 1.6s ease-in-out infinite;
  }

  .chart-empty {
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
    color: #3A3A50;
    letter-spacing: 0.06em;
  }

  /* ── Data panel (tables) ─────────────────────────────── */
  .data-panel {
    position: relative;
    background: #0F0F18;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    padding: 24px;
    overflow: hidden;
  }

  :global(.data-tabs-list) {
    margin-bottom: 16px;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Outfit', sans-serif;
    font-size: 13px;
  }
  .data-table thead tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .data-table th {
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #9090A8;
    text-align: left;
    white-space: nowrap;
  }
  .data-table td {
    padding: 12px 14px;
    color: #F6F6FF;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .data-table tbody tr {
    transition: background 0.12s;
  }
  .data-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  .tr-clickable {
    cursor: pointer;
  }
  .tr-clickable:hover {
    background: rgba(1, 250, 251, 0.04) !important;
  }

  .td-mono {
    font-family: 'Space Grotesk', monospace;
    font-size: 12px;
    color: #9090A8;
  }
  .td-empty {
    text-align: center;
    padding: 40px 16px !important;
    color: #3A3A50;
    font-size: 13px;
    letter-spacing: 0.04em;
  }

  /* ── Table pagination ────────────────────────────────── */
  .table-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    margin-top: 4px;
  }
  .pagination-info {
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    color: #9090A8;
    font-variant-numeric: tabular-nums;
  }
  .pagination-btns {
    display: flex;
    gap: 8px;
  }

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 900px) {
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .page { padding: 20px 16px; }
    .metrics-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .filter-row { flex-direction: column; align-items: stretch; }
    .filter-actions { margin-left: 0; justify-content: flex-end; }
  }
</style>
