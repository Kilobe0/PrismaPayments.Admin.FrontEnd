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
    ScanFace
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { DashboardService } from '../../services/DashboardService';
  import { DashboardRepository } from '../../data/repositories/DashboardRepository';
  import { formatCurrency } from '$appmod/shared/utils/formatters';
  import type { AdminMetrics } from '../../domain/entities/AdminMetrics';
  import type { DashboardChartData, DashboardPeriod } from '../../domain/entities/DashboardSeries';

  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

  let metrics = $state<AdminMetrics | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let activePeriod = $state<DashboardPeriod>('today');
  let chartData = $state<DashboardChartData | null>(null);
  let chartLoading = $state(false);

  const service = new DashboardService(new DashboardRepository());

  // DEV: mock data when backend is unavailable
  const MOCK_METRICS: AdminMetrics = {
    totalVolume: 158432900,
    totalTransactions: 4821,
    todayVolume: 9876500,
    todayTransactions: 143,
    availableBalance: 72300000,
    pendingBalance: 8450000,
    totalFeesCollected: 3168658,
    totalMerchants: 37,
    openDisputes: 3,
    pendingKycCount: 7
  };

  const MOCK_CHART: Record<DashboardPeriod, DashboardChartData> = {
    today: {
      period: 'today',
      points: [
        { label: '08h', volume: 120000, transactions: 8 },
        { label: '10h', volume: 340000, transactions: 21 },
        { label: '12h', volume: 890000, transactions: 54 },
        { label: '14h', volume: 1230000, transactions: 31 },
        { label: '16h', volume: 760000, transactions: 19 },
        { label: '18h', volume: 430000, transactions: 10 }
      ]
    },
    week: {
      period: 'week',
      points: [
        { label: 'Seg', volume: 1200000, transactions: 89 },
        { label: 'Ter', volume: 1870000, transactions: 124 },
        { label: 'Qua', volume: 2340000, transactions: 198 },
        { label: 'Qui', volume: 980000, transactions: 67 },
        { label: 'Sex', volume: 3100000, transactions: 241 },
        { label: 'Sáb', volume: 430000, transactions: 28 },
        { label: 'Dom', volume: 210000, transactions: 14 }
      ]
    },
    month: {
      period: 'month',
      points: [
        { label: '01/03', volume: 4200000, transactions: 310 },
        { label: '08/03', volume: 6800000, transactions: 489 },
        { label: '15/03', volume: 9100000, transactions: 672 },
        { label: '22/03', volume: 7400000, transactions: 521 },
        { label: '29/03', volume: 3900000, transactions: 287 }
      ]
    },
    year: {
      period: 'year',
      points: [
        { label: 'Jan', volume: 28000000, transactions: 1920 },
        { label: 'Fev', volume: 31500000, transactions: 2140 },
        { label: 'Mar', volume: 41200000, transactions: 2890 },
        { label: 'Abr', volume: 0, transactions: 0 },
        { label: 'Mai', volume: 0, transactions: 0 },
        { label: 'Jun', volume: 0, transactions: 0 }
      ]
    }
  };

  onMount(async () => {
    const result = await service.getMetrics();
    metrics = result.ok ? result.value : MOCK_METRICS;
    loading = false;
  });

  $effect(() => {
    const period = activePeriod;
    chartLoading = true;
    chartData = null;
    service.getChartData(period).then((result) => {
      chartData = result.ok ? result.value : MOCK_CHART[period];
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
        backgroundColor: 'rgba(192, 38, 211, 0.12)',
        borderColor: 'rgba(192, 38, 211, 0.55)',
        borderWidth: 1,
        borderRadius: 3
      }
    ]
  } : { labels: [], datasets: [] });

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a0910',
        borderColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        titleColor: 'rgba(218,212,196,0.90)',
        bodyColor: 'rgba(218,212,196,0.45)',
        padding: 12,
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont:  { family: 'JetBrains Mono', size: 11 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(218,212,196,0.35)', font: { family: 'JetBrains Mono', size: 10 } },
        border: { color: 'rgba(255,255,255,0.06)' }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(218,212,196,0.35)', font: { family: 'JetBrains Mono', size: 10 } },
        border: { color: 'rgba(255,255,255,0.06)' }
      }
    }
  };
</script>

<div class="page">
  <!-- Header -->
  <div class="page-header">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Visão geral da plataforma</p>
  </div>

  <!-- Alert banners -->
  {#if !loading && metrics && (metrics.openDisputes > 0 || metrics.pendingKycCount > 0)}
    <div class="alerts">
      {#if metrics.openDisputes > 0}
        <button
          type="button"
          class="alert-card alert-danger"
          onclick={() => goto('/disputes')}
        >
          <AlertTriangle size={14} strokeWidth={1.5} />
          <span class="alert-label">DISPUTAS ABERTAS</span>
          <span class="alert-count">{metrics.openDisputes}</span>
        </button>
      {/if}
      {#if metrics.pendingKycCount > 0}
        <button
          type="button"
          class="alert-card alert-warn"
          onclick={() => goto('/merchants?verification=PENDING_REVIEW')}
        >
          <Clock size={14} strokeWidth={1.5} />
          <span class="alert-label">KYC PENDENTE</span>
          <span class="alert-count">{metrics.pendingKycCount}</span>
        </button>
      {/if}
    </div>
  {/if}

  <!-- Section: Financeiro -->
  <div class="section-label">FINANCEIRO</div>
  <div class="metrics-grid">
    {#if loading}
      {#each Array(4) as _}
        <div class="metric-card">
          <Skeleton class="skeleton-icon" />
          <Skeleton class="skeleton-label" />
          <Skeleton class="skeleton-value" />
        </div>
      {/each}
    {:else if metrics}
      <div class="metric-card">
        <TrendingUp size={14} class="metric-icon" />
        <span class="metric-label">VOLUME TOTAL</span>
        <span class="metric-value">{formatCurrency(metrics.totalVolume)}</span>
      </div>
      <div class="metric-card">
        <Wallet size={14} class="metric-icon" />
        <span class="metric-label">SALDO DISPONÍVEL</span>
        <span class="metric-value">{formatCurrency(metrics.availableBalance)}</span>
      </div>
      <div class="metric-card">
        <Hourglass size={14} class="metric-icon" />
        <span class="metric-label">SALDO PENDENTE</span>
        <span class="metric-value metric-muted">{formatCurrency(metrics.pendingBalance)}</span>
      </div>
      <div class="metric-card">
        <Receipt size={14} class="metric-icon" />
        <span class="metric-label">TAXAS COLETADAS</span>
        <span class="metric-value">{formatCurrency(metrics.totalFeesCollected)}</span>
      </div>
    {/if}
  </div>

  <!-- Section: Operacional -->
  <div class="section-label">OPERACIONAL</div>
  <div class="metrics-grid">
    {#if loading}
      {#each Array(4) as _}
        <div class="metric-card">
          <Skeleton class="skeleton-icon" />
          <Skeleton class="skeleton-label" />
          <Skeleton class="skeleton-value" />
        </div>
      {/each}
    {:else if metrics}
      <div class="metric-card">
        <CreditCard size={14} class="metric-icon" />
        <span class="metric-label">TRANSAÇÕES HOJE</span>
        <span class="metric-value">{metrics.todayTransactions.toLocaleString('pt-BR')}</span>
        <span class="metric-sub">{metrics.totalTransactions.toLocaleString('pt-BR')} no total</span>
      </div>
      <div class="metric-card">
        <Store size={14} class="metric-icon" />
        <span class="metric-label">MERCHANTS</span>
        <span class="metric-value">{metrics.totalMerchants.toLocaleString('pt-BR')}</span>
      </div>
      <div class="metric-card {metrics.openDisputes > 0 ? 'metric-card-danger' : ''}">
        <ShieldAlert size={14} class="metric-icon {metrics.openDisputes > 0 ? 'metric-icon-danger' : ''}" />
        <span class="metric-label">DISPUTAS ABERTAS</span>
        <span class="metric-value {metrics.openDisputes > 0 ? 'metric-value-danger' : ''}">{metrics.openDisputes}</span>
      </div>
      <div class="metric-card {metrics.pendingKycCount > 0 ? 'metric-card-warn' : ''}">
        <ScanFace size={14} class="metric-icon {metrics.pendingKycCount > 0 ? 'metric-icon-warn' : ''}" />
        <span class="metric-label">KYC PENDENTE</span>
        <span class="metric-value {metrics.pendingKycCount > 0 ? 'metric-value-warn' : ''}">{metrics.pendingKycCount}</span>
      </div>
    {/if}
  </div>

  <!-- Chart section -->
  <div class="chart-panel">
    <div class="prism-line" aria-hidden="true"></div>
    <div class="chart-header">
      <span class="chart-title">VOLUME DE TRANSAÇÕES</span>
      <Tabs bind:value={activePeriod} class="chart-tabs">
        <TabsList>
          {#each PERIODS as p}
            <TabsTrigger value={p.key}>{p.label}</TabsTrigger>
          {/each}
        </TabsList>
      </Tabs>
    </div>

    {#if chartLoading}
      <div class="chart-loading">
        <Skeleton class="chart-skeleton" />
      </div>
    {:else if chartData && chartData.points.length > 0}
      <div class="chart-area">
        <Bar data={barChartData} options={barChartOptions} />
      </div>
    {:else}
      <div class="chart-empty">
        <span>SEM DADOS PARA O PERÍODO</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* ── Prism gradient ──────────────────────────────────── */
  :root {
    --prism: linear-gradient(
      90deg,
      #c026d3 0%, #7c3aed 22%, #4f46e5 44%,
      #0891b2 70%, #06b6d4 86%, #c026d3 100%
    );
  }
  @keyframes prism-shift {
    from { background-position: 0%   0%; }
    to   { background-position: 200% 0%; }
  }

  /* ── Page layout ─────────────────────────────────────── */
  .page {
    padding: 32px 36px;
    max-width: 1120px;
    margin: 0 auto;
    animation: enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes enter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .page-header { margin-bottom: 28px; }

  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(218, 212, 196, 0.90);
    margin: 0 0 4px;
    text-transform: uppercase;
  }

  .page-subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(218, 212, 196, 0.35);
    margin: 0;
  }

  /* ── Alert banners ───────────────────────────────────── */
  .alerts {
    display: flex;
    gap: 8px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .alert-card {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid;
    transition: background 0.18s;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .alert-danger {
    background: rgba(180, 60, 60, 0.08);
    border-color: rgba(180, 60, 60, 0.30);
    color: rgba(200, 100, 100, 0.85);
  }
  .alert-danger:hover { background: rgba(180, 60, 60, 0.14); }

  .alert-warn {
    background: rgba(180, 130, 40, 0.08);
    border-color: rgba(180, 130, 40, 0.30);
    color: rgba(218, 168, 80, 0.85);
  }
  .alert-warn:hover { background: rgba(180, 130, 40, 0.14); }

  .alert-label { flex: 1; }

  .alert-count {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0;
  }

  /* ── Section label ───────────────────────────────────── */
  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(218, 212, 196, 0.22);
    margin-bottom: 10px;
    margin-top: 4px;
  }

  /* ── Metrics grid ────────────────────────────────────── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }

  .metric-card {
    position: relative;
    background: #0a0910;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    padding: 18px 20px 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: inset 0 0 40px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5);
    transition: border-color 0.18s;
  }
  .metric-card:hover {
    border-color: rgba(255, 255, 255, 0.13);
  }

  .metric-card-danger {
    border-color: rgba(180, 60, 60, 0.25);
  }
  .metric-card-warn {
    border-color: rgba(180, 130, 40, 0.25);
  }

  :global(.metric-icon) {
    color: rgba(218, 212, 196, 0.22);
    margin-bottom: 4px;
  }
  :global(.metric-icon-danger) { color: rgba(200, 100, 100, 0.55) !important; }
  :global(.metric-icon-warn)   { color: rgba(218, 168, 80, 0.55)  !important; }

  .metric-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.20em;
    text-transform: uppercase;
    color: rgba(218, 212, 196, 0.35);
  }

  .metric-value {
    font-family: 'Syne', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: rgba(218, 212, 196, 0.90);
    letter-spacing: 0.02em;
    line-height: 1.2;
  }
  .metric-muted  { color: rgba(218, 212, 196, 0.50); }
  .metric-value-danger { color: rgba(200, 100, 100, 0.85); }
  .metric-value-warn   { color: rgba(218, 168, 80, 0.85); }

  .metric-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.10em;
    color: rgba(218, 212, 196, 0.22);
    margin-top: 2px;
  }

  /* ── Skeleton overrides ──────────────────────────────── */
  :global(.skeleton-icon)  { width: 14px; height: 14px; border-radius: 3px; }
  :global(.skeleton-label) { width: 80px;  height: 9px;  border-radius: 2px; }
  :global(.skeleton-value) { width: 120px; height: 20px; border-radius: 3px; margin-top: 4px; }

  /* ── Chart panel ─────────────────────────────────────── */
  .chart-panel {
    position: relative;
    background: #0a0910;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 6px;
    padding: 20px 24px 24px;
    overflow: hidden;
    box-shadow: inset 0 0 60px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.6);
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .chart-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(218, 212, 196, 0.35);
  }

  :global(.chart-tabs) {
    gap: 0 !important;
  }

  .chart-area {
    height: 260px;
    position: relative;
  }

  .chart-loading {
    height: 260px;
    display: flex;
    align-items: stretch;
    gap: 8px;
    padding-top: 12px;
  }

  :global(.chart-skeleton) {
    flex: 1;
    height: 100%;
    border-radius: 3px;
  }

  .chart-empty {
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(218, 212, 196, 0.22);
  }

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 900px) {
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .page { padding: 20px 16px; }
    .metrics-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  }
</style>
