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
  import { Button } from '$lib/components/ui/button/index.js';
  import DateRangeFilter from '$appmod/shared/widgets/filters/DateRangeFilter.svelte';
  import SelectFilter from '$appmod/shared/widgets/filters/SelectFilter.svelte';
  import { DashboardService } from '../../services/DashboardService';
  import { DashboardRepository } from '../../data/repositories/DashboardRepository';
  import { formatCurrency, formatDate } from '$appmod/shared/utils/formatters';
  import type {
    AdminDashboardResponse,
    AdminDashboardFilters,
    PaymentStatus,
    PaymentMethod
  } from '../../domain/entities/AdminDashboardResponse';

  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

  type PeriodKey = 'today' | 'week' | 'month' | 'year';

  // ── State ───────────────────────────────────────────
  let dashboard = $state<AdminDashboardResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let activePeriod = $state<PeriodKey>('week');
  let filtersOpen = $state(false);

  // ── Filtros ─────────────────────────────────────────
  let filterStartDate = $state('');
  let filterEndDate = $state('');
  let filterPaymentStatus = $state('');
  let filterMethod = $state('');
  let filterMerchantId = $state('');
  let filterMerchantStatus = $state('');
  let filterDisputeStatus = $state('');
  let filterProviderName = $state('');

  const service = new DashboardService(new DashboardRepository());

  // ── Period presets ──────────────────────────────────
  const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week',  label: 'Semana' },
    { key: 'month', label: 'Mês' },
    { key: 'year',  label: 'Ano' }
  ];

  function getPeriodDates(period: PeriodKey): { start: string; end: string } {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today);
    if (period === 'week') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'month') {
      start.setDate(start.getDate() - 29);
    } else if (period === 'year') {
      start.setFullYear(start.getFullYear() - 1);
    }
    return { start: start.toISOString().slice(0, 10), end };
  }

  function applyPeriodPreset(period: PeriodKey) {
    activePeriod = period;
    const { start, end } = getPeriodDates(period);
    filterStartDate = start;
    filterEndDate = end;
    fetchDashboard();
  }

  // ── Chart data derived from payments items ──────────
  const derivedChartData = $derived.by(() => {
    if (!dashboard) return { labels: [] as string[], datasets: [] };

    const items = dashboard.payments.items ?? [];
    const buckets = new Map<string, number>();
    const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    if (activePeriod === 'today') {
      for (let h = 0; h < 24; h++) buckets.set(`${h.toString().padStart(2, '0')}h`, 0);
    } else if (activePeriod === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        buckets.set(DAYS_PT[d.getDay()], 0);
      }
    } else if (activePeriod === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        buckets.set(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`, 0);
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        buckets.set(MONTHS_PT[d.getMonth()], 0);
      }
    }

    for (const item of items) {
      if (!item.createdAt || !item.amount) continue;
      const d = new Date(item.createdAt);
      let key: string;
      if (activePeriod === 'today') {
        key = `${d.getHours().toString().padStart(2, '0')}h`;
      } else if (activePeriod === 'week') {
        key = DAYS_PT[d.getDay()];
      } else if (activePeriod === 'month') {
        key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        key = MONTHS_PT[d.getMonth()];
      }
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + item.amount);
      }
    }

    return {
      labels: Array.from(buckets.keys()),
      datasets: [
        {
          label: 'Volume (R$)',
          data: Array.from(buckets.values()).map((v) => v / 100),
          backgroundColor: 'rgba(1, 250, 251, 0.08)',
          borderColor: 'rgba(1, 250, 251, 0.40)',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(1, 250, 251, 0.14)',
          hoverBorderColor: 'rgba(1, 250, 251, 0.65)'
        }
      ]
    };
  });

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
        bodyFont: { family: 'Outfit', size: 12 }
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
    f.skip = 0;
    f.limit = 100;
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
    filterPaymentStatus = '';
    filterMethod = '';
    filterMerchantId = '';
    filterMerchantStatus = '';
    filterDisputeStatus = '';
    filterProviderName = '';
    applyPeriodPreset('week');
  }

  function applyFilters() {
    fetchDashboard();
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
    applyPeriodPreset('week');
  });

  // ── Derived ─────────────────────────────────────────
  const openDisputes = $derived(dashboard?.disputes?.open ?? 0);
  const pendingMerchants = $derived(dashboard?.merchants?.pending ?? 0);
  const hasChartData = $derived(derivedChartData.datasets[0]?.data.some((v) => v > 0) ?? false);
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
      <Filter size={14} strokeWidth={1.5} />
      <span>Filtros</span>
      {#if filtersOpen}
        <ChevronUp size={13} strokeWidth={1.5} />
      {:else}
        <ChevronDown size={13} strokeWidth={1.5} />
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
            <RotateCcw size={13} strokeWidth={1.5} />
            Limpar
          </Button>
          <Button size="sm" onclick={applyFilters}>Aplicar</Button>
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
          <AlertTriangle size={14} strokeWidth={1.5} />
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
          <Clock size={14} strokeWidth={1.5} />
          <span class="alert-label">Merchants pendentes</span>
          <span class="alert-count">{pendingMerchants}</span>
        </button>
      {/if}
    </div>
  {/if}

  <!-- Metrics — single line, two labeled groups -->
  <div class="metrics-row anim-2">
    <div class="metrics-group">
      <p class="section-label">Financeiro</p>
      <div class="metrics-grid">
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
              <TrendingUp size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Volume pagamentos</span>
            <span class="metric-value">{formatCurrency(dashboard.payments.volume)}</span>
          </div>
          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon--green">
              <Wallet size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Pagos</span>
            <span class="metric-value">{dashboard.payments.paid.toLocaleString('pt-BR')}</span>
            <span class="metric-sub">{dashboard.payments.total.toLocaleString('pt-BR')} no total</span>
          </div>
          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon--muted">
              <Hourglass size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Processando</span>
            <span class="metric-value metric-value--muted">{dashboard.payments.processing.toLocaleString('pt-BR')}</span>
          </div>
          <div class="metric-card {dashboard.payments.failed > 0 ? 'metric-card--danger' : ''}">
            <div class="metric-icon-wrap {dashboard.payments.failed > 0 ? 'metric-icon--danger' : 'metric-icon--purple'}">
              <Receipt size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Falhos</span>
            <span class="metric-value {dashboard.payments.failed > 0 ? 'metric-value--danger' : ''}">{dashboard.payments.failed.toLocaleString('pt-BR')}</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="metrics-divider" aria-hidden="true"></div>

    <div class="metrics-group">
      <p class="section-label">Operacional</p>
      <div class="metrics-grid">
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
              <CreditCard size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Saques</span>
            <span class="metric-value">{dashboard.withdrawals.total.toLocaleString('pt-BR')}</span>
            <span class="metric-sub">Hoje: {formatCurrency(dashboard.withdrawals.todayVolume)}</span>
          </div>
          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon--cyan">
              <Store size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Merchants</span>
            <span class="metric-value">{dashboard.merchants.total.toLocaleString('pt-BR')}</span>
            <span class="metric-sub">{dashboard.merchants.active.toLocaleString('pt-BR')} ativos</span>
          </div>
          <div class="metric-card {openDisputes > 0 ? 'metric-card--danger' : ''}">
            <div class="metric-icon-wrap {openDisputes > 0 ? 'metric-icon--danger' : 'metric-icon--muted'}">
              <ShieldAlert size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Disputas abertas</span>
            <span class="metric-value {openDisputes > 0 ? 'metric-value--danger' : ''}">{openDisputes}</span>
          </div>
          <div class="metric-card">
            <div class="metric-icon-wrap metric-icon--muted">
              <ScanFace size={14} strokeWidth={1.5} />
            </div>
            <span class="metric-label">Webhook failures</span>
            <span class="metric-value">{dashboard.webhookFailures.total.toLocaleString('pt-BR')}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Chart — full width, prominent -->
  <div class="chart-panel anim-3">
    <div class="chart-accent" aria-hidden="true"></div>
    <div class="chart-header">
      <div>
        <p class="chart-title">Volume de transações</p>
        <p class="chart-subtitle">Por período selecionado</p>
      </div>
      <div class="period-pills">
        {#each PERIODS as p}
          <button
            type="button"
            class="period-pill {activePeriod === p.key ? 'period-pill--active' : ''}"
            onclick={() => applyPeriodPreset(p.key)}
          >
            {p.label}
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="chart-skeleton-wrap">
        {#each [55, 75, 90, 60, 80, 45, 70, 65, 85, 50] as h}
          <div class="chart-skeleton-bar" style="height: {h}%"></div>
        {/each}
      </div>
    {:else if hasChartData}
      <div class="chart-area">
        <Bar data={derivedChartData} options={barChartOptions} />
      </div>
    {:else}
      <div class="chart-empty">
        <span>Sem dados para o período</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* ── Page layout ─────────────────────────────────────── */
  .page {
    padding: 28px 32px;
    max-width: 1480px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  @keyframes page-enter {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-1 { animation: page-enter 0.38s cubic-bezier(0.22, 1, 0.36, 1)   0ms both; }
  .anim-2 { animation: page-enter 0.38s cubic-bezier(0.22, 1, 0.36, 1)  70ms both; }
  .anim-3 { animation: page-enter 0.38s cubic-bezier(0.22, 1, 0.36, 1) 140ms both; }

  /* ── Header ──────────────────────────────────────────── */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 16px;
  }

  .page-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #F6F6FF;
    margin: 0 0 3px;
    text-transform: uppercase;
  }
  .page-subtitle {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
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
    gap: 7px;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: #0F0F18;
    color: #9090A8;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .filter-toggle:hover {
    border-color: rgba(255, 255, 255, 0.15);
    color: #F6F6FF;
  }

  /* ── Filter bar ──────────────────────────────────────── */
  .filter-bar {
    background: #0F0F18;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .filter-row {
    display: flex;
    align-items: center;
    gap: 10px;
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
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .alert-card {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 10px;
    cursor: pointer;
    border: 1px solid;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
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
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0;
  }

  /* ── Section label ───────────────────────────────────── */
  .section-label {
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #3A3A50;
    margin: 0 0 10px;
  }

  /* ── Metrics row ─────────────────────────────────────── */
  .metrics-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }

  .metrics-group {
    flex: 1;
    min-width: 0;
  }

  .metrics-divider {
    width: 1px;
    align-self: stretch;
    background: rgba(255, 255, 255, 0.06);
    margin-top: 20px;
    flex-shrink: 0;
  }

  /* ── Metrics grid (4 cards in a row per group) ────────── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .metric-card {
    position: relative;
    background: #0F0F18;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.50), 0 2px 6px rgba(0,0,0,0.40);
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
  }
  .metric-card:hover {
    border-color: rgba(255, 255, 255, 0.14);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.45);
  }
  .metric-card--danger { border-color: rgba(255, 59, 92, 0.25); }

  /* ── Icon containers ──────────────────────────────────── */
  .metric-icon-wrap {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
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
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9090A8;
    line-height: 1;
  }
  .metric-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: #F6F6FF;
    letter-spacing: 0.01em;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }
  .metric-value--muted  { color: #9090A8; }
  .metric-value--danger { color: #FF3B5C; }

  .metric-sub {
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    color: #3A3A50;
    letter-spacing: 0.02em;
  }

  /* ── Skeleton ────────────────────────────────────────── */
  .sk-icon, .sk-label, .sk-value {
    background: #141420;
    border-radius: 8px;
    animation: sk-pulse 1.6s ease-in-out infinite;
  }
  .sk-icon  { width: 30px; height: 30px; border-radius: 8px; margin-bottom: 2px; }
  .sk-label { width: 70px;  height: 10px; border-radius: 4px; }
  .sk-value { width: 100px; height: 20px; border-radius: 5px; }
  @keyframes sk-pulse {
    0%, 100% { opacity: 0.30; }
    50%       { opacity: 0.65; }
  }

  /* ── Chart panel ─────────────────────────────────────── */
  .chart-panel {
    position: relative;
    background: #0F0F18;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 20px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,0.50), 0 2px 6px rgba(0,0,0,0.40);
  }

  .chart-accent {
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
    border-radius: 14px 14px 0 0;
  }

  .chart-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .chart-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #F6F6FF;
    margin: 0 0 3px;
    letter-spacing: 0.01em;
  }
  .chart-subtitle {
    font-family: 'Outfit', sans-serif;
    font-size: 10px;
    color: #9090A8;
    margin: 0;
    letter-spacing: 0.04em;
  }

  /* ── Period pills ─────────────────────────────────────── */
  .period-pills {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .period-pill {
    padding: 4px 10px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: transparent;
    color: #9090A8;
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.13s, border-color 0.13s, color 0.13s;
    white-space: nowrap;
  }
  .period-pill:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #F6F6FF;
    border-color: rgba(255, 255, 255, 0.13);
  }
  .period-pill--active {
    background: rgba(1, 250, 251, 0.08);
    border-color: rgba(1, 250, 251, 0.25);
    color: #01FAFB;
  }
  .period-pill--active:hover {
    background: rgba(1, 250, 251, 0.12);
  }

  .chart-area {
    height: 380px;
    position: relative;
  }

  @media (min-width: 1280px) {
    .chart-area {
      height: 420px;
    }
  }

  .chart-skeleton-wrap {
    height: 380px;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 0 4px;
  }

  @media (min-width: 1280px) {
    .chart-skeleton-wrap { height: 420px; }
  }

  .chart-skeleton-bar {
    flex: 1;
    background: #141420;
    border-radius: 5px 5px 0 0;
    animation: sk-pulse 1.6s ease-in-out infinite;
  }

  .chart-empty {
    height: 380px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
    color: #3A3A50;
    letter-spacing: 0.06em;
  }

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 1100px) {
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 760px) {
    .metrics-row { flex-direction: column; }
    .metrics-divider { display: none; }
    .metrics-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 520px) {
    .page { padding: 16px 14px; }
    .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .filter-row { flex-direction: column; align-items: stretch; }
    .filter-actions { margin-left: 0; justify-content: flex-end; }
    .period-pills { flex-wrap: wrap; }
    .chart-area, .chart-skeleton-wrap, .chart-empty { height: 280px; }
  }
</style>
