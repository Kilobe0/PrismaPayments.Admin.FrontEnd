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
    if (result.ok) {
      metrics = result.value;
    } else {
      error = result.failure.message;
    }
    loading = false;
  });

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
        titleFont: { family: 'Outfit', size: 13, weight: '600' },
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
</script>

<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Visão geral da plataforma</p>
    </div>
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
          <AlertTriangle size={15} strokeWidth={1.5} />
          <span class="alert-label">Disputas abertas</span>
          <span class="alert-count">{metrics.openDisputes}</span>
        </button>
      {/if}
      {#if metrics.pendingKycCount > 0}
        <button
          type="button"
          class="alert-card alert-warn"
          onclick={() => goto('/merchants?verification=PENDING_REVIEW')}
        >
          <Clock size={15} strokeWidth={1.5} />
          <span class="alert-label">KYC pendente de revisão</span>
          <span class="alert-count">{metrics.pendingKycCount}</span>
        </button>
      {/if}
    </div>
  {/if}

  <!-- ── Financeiro ── -->
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
    {:else if metrics}
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--cyan">
          <TrendingUp size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Volume total</span>
        <span class="metric-value">{formatCurrency(metrics.totalVolume)}</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--green">
          <Wallet size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Saldo disponível</span>
        <span class="metric-value">{formatCurrency(metrics.availableBalance)}</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--muted">
          <Hourglass size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Saldo pendente</span>
        <span class="metric-value metric-value--muted">{formatCurrency(metrics.pendingBalance)}</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--purple">
          <Receipt size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Taxas coletadas</span>
        <span class="metric-value">{formatCurrency(metrics.totalFeesCollected)}</span>
      </div>
    {/if}
  </div>

  <!-- ── Operacional ── -->
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
    {:else if metrics}
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--cyan">
          <CreditCard size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Transações hoje</span>
        <span class="metric-value">{metrics.todayTransactions.toLocaleString('pt-BR')}</span>
        <span class="metric-sub">{metrics.totalTransactions.toLocaleString('pt-BR')} no total</span>
      </div>
      <div class="metric-card">
        <div class="metric-icon-wrap metric-icon--cyan">
          <Store size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Merchants ativos</span>
        <span class="metric-value">{metrics.totalMerchants.toLocaleString('pt-BR')}</span>
      </div>
      <div class="metric-card {metrics.openDisputes > 0 ? 'metric-card--danger' : ''}">
        <div class="metric-icon-wrap {metrics.openDisputes > 0 ? 'metric-icon--danger' : 'metric-icon--muted'}">
          <ShieldAlert size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">Disputas abertas</span>
        <span class="metric-value {metrics.openDisputes > 0 ? 'metric-value--danger' : ''}">{metrics.openDisputes}</span>
      </div>
      <div class="metric-card {metrics.pendingKycCount > 0 ? 'metric-card--warn' : ''}">
        <div class="metric-icon-wrap {metrics.pendingKycCount > 0 ? 'metric-icon--warn' : 'metric-icon--muted'}">
          <ScanFace size={16} strokeWidth={1.5} />
        </div>
        <span class="metric-label">KYC pendente</span>
        <span class="metric-value {metrics.pendingKycCount > 0 ? 'metric-value--warn' : ''}">{metrics.pendingKycCount}</span>
      </div>
    {/if}
  </div>

  <!-- ── Chart ── -->
  <div class="chart-panel">
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
</div>

<style>
  /* ── Page layout ─────────────────────────────────────── */
  .page {
    padding: 32px 36px;
    max-width: 1120px;
    margin: 0 auto;
    animation: page-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes page-enter {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ──────────────────────────────────────────── */
  .page-header { margin-bottom: 28px; }

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
  .alert-card:hover { transform: translateY(-1px); }

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
  .metric-card--warn   { border-color: rgba(255, 179, 0, 0.22); }

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
  .metric-icon--warn   { background: rgba(255, 179, 0, 0.08);  border: 1px solid rgba(255, 179, 0, 0.18);  color: #FFB300; }

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
  }
  .metric-value--muted  { color: #9090A8; }
  .metric-value--danger { color: #FF3B5C; }
  .metric-value--warn   { color: #FFB300; }

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
  }

  /* Linha de acento gradiente no topo do painel */
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

  /* Skeleton de barras para o gráfico */
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

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 900px) {
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 520px) {
    .page { padding: 20px 16px; }
    .metrics-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  }
</style>
