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
  import { AlertTriangle, Clock } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { DashboardService } from '../../services/DashboardService';
  import { DashboardRepository } from '../../data/repositories/DashboardRepository';
  import { formatCurrency } from '$appmod/shared/utils/formatters';
  import type { AdminMetrics } from '../../domain/entities/AdminMetrics';
  import type { DashboardChartData, DashboardPeriod } from '../../domain/entities/DashboardSeries';

  // Register Chart.js components (must be done once, client-side only)
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
      // DEV: fallback to mock data when backend is unavailable
      metrics = MOCK_METRICS;
    }
    loading = false;
  });

  // Re-fetch chart data whenever activePeriod changes
  $effect(() => {
    const period = activePeriod;
    chartLoading = true;
    chartData = null;
    service.getChartData(period).then((result) => {
      if (result.ok) {
        chartData = result.value;
      } else {
        // DEV: fallback to mock data when backend is unavailable
        chartData = MOCK_CHART[period];
      }
      chartLoading = false;
    });
  });

  const PERIODS: { key: DashboardPeriod; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mês' },
    { key: 'year', label: 'Este ano' }
  ];

  const metricCards = $derived(metrics ? [
    { label: 'Volume total', value: formatCurrency(metrics.totalVolume) },
    { label: 'Transações hoje', value: metrics.todayTransactions.toLocaleString('pt-BR') },
    { label: 'Taxas coletadas', value: formatCurrency(metrics.totalFeesCollected) },
    { label: 'Merchants', value: metrics.totalMerchants.toLocaleString('pt-BR') }
  ] : []);

  const barChartData = $derived(chartData ? {
    labels: chartData.points.map(p => p.label),
    datasets: [
      {
        label: 'Volume (R$)',
        data: chartData.points.map(p => p.volume / 100),
        backgroundColor: 'rgba(1, 250, 251, 0.15)',
        borderColor: 'rgba(1, 250, 251, 0.7)',
        borderWidth: 1,
        borderRadius: 4
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
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#F6F6FF',
        bodyColor: '#9090A8'
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#9090A8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#9090A8', font: { size: 11 } }
      }
    }
  };
</script>

<div style="padding: 32px; max-width: 1080px; margin: 0 auto;">
  <!-- Page header -->
  <div style="margin-bottom: 32px;">
    <h1 style="font-family: var(--font-display); font-size: 1.875rem; font-weight: 700; color: #F6F6FF; margin: 0 0 4px;">
      Dashboard
    </h1>
    <p style="color: #9090A8; font-size: 0.875rem; margin: 0;">
      Visão geral da plataforma
    </p>
  </div>

  {#if loading}
    <div style="display: flex; align-items: center; justify-content: center; padding: 64px 0;">
      <p style="color: #9090A8;">Carregando métricas...</p>
    </div>
  {:else if error}
    <div style="background: rgba(255,59,92,0.10); border: 1px solid rgba(255,59,92,0.20); border-radius: 12px; padding: 16px;">
      <p style="color: #FF3B5C; margin: 0;">{error}</p>
    </div>
  {:else}
    <!-- DASH-03: Alert cards — rendered above metric cards, only when count > 0 -->
    {#if metrics && (metrics.openDisputes > 0 || metrics.pendingKycCount > 0)}
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;">
        {#if metrics.openDisputes > 0}
          <button
            type="button"
            onclick={() => goto('/disputes')}
            style="
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              padding: 14px 16px;
              background: rgba(255,59,92,0.10);
              border: 1px solid rgba(255,59,92,0.20);
              border-radius: 12px;
              cursor: pointer;
              text-align: left;
              transition: background 0.15s;
            "
            onmouseenter={(e) => (e.currentTarget.style.background = 'rgba(255,59,92,0.16)')}
            onmouseleave={(e) => (e.currentTarget.style.background = 'rgba(255,59,92,0.10)')}
          >
            <AlertTriangle size={16} strokeWidth={1.5} style="color: #FF3B5C; flex-shrink: 0;" />
            <span style="font-size: 0.875rem; color: #F6F6FF;">
              <strong style="color: #FF3B5C;">{metrics.openDisputes}</strong>
              {metrics.openDisputes === 1 ? 'disputa aberta' : 'disputas abertas'}
            </span>
          </button>
        {/if}

        {#if metrics.pendingKycCount > 0}
          <button
            type="button"
            onclick={() => goto('/merchants?verification=PENDING_REVIEW')}
            style="
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              padding: 14px 16px;
              background: rgba(255,179,0,0.10);
              border: 1px solid rgba(255,179,0,0.20);
              border-radius: 12px;
              cursor: pointer;
              text-align: left;
              transition: background 0.15s;
            "
            onmouseenter={(e) => (e.currentTarget.style.background = 'rgba(255,179,0,0.16)')}
            onmouseleave={(e) => (e.currentTarget.style.background = 'rgba(255,179,0,0.10)')}
          >
            <Clock size={16} strokeWidth={1.5} style="color: #FFB300; flex-shrink: 0;" />
            <span style="font-size: 0.875rem; color: #F6F6FF;">
              <strong style="color: #FFB300;">{metrics.pendingKycCount}</strong>
              {metrics.pendingKycCount === 1 ? 'verificação pendente' : 'verificações pendentes'}
            </span>
          </button>
        {/if}
      </div>
    {/if}

    <!-- DASH-01: Metric cards grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px;">
      {#each metricCards as card}
        <div style="background: #0F0F18; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.50);">
          <p style="font-size: 0.75rem; font-weight: 400; color: #9090A8; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;">
            {card.label}
          </p>
          <p style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: #F6F6FF; margin: 0;">
            {card.value}
          </p>
        </div>
      {/each}
    </div>

    <!-- DASH-02: Period tabs + bar chart -->
    <div style="background: #0F0F18; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.50);">
      <!-- Period tab strip -->
      <div style="display: inline-flex; gap: 4px; margin-bottom: 24px;">
        {#each PERIODS as period}
          <button
            type="button"
            onclick={() => (activePeriod = period.key)}
            style="
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 0.875rem;
              cursor: pointer;
              transition: background 0.15s;
              {activePeriod === period.key
                ? 'background: #141420; color: #F6F6FF; border: 1px solid rgba(255,255,255,0.14); font-weight: 400;'
                : 'background: transparent; color: #9090A8; border: 1px solid transparent;'}
            "
            onmouseenter={(e) => {
              if (activePeriod !== period.key) {
                e.currentTarget.style.background = '#0F0F18';
              }
            }}
            onmouseleave={(e) => {
              if (activePeriod !== period.key) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {period.label}
          </button>
        {/each}
      </div>

      <!-- Chart area -->
      {#if chartLoading}
        <div style="height: 280px; display: flex; align-items: center; justify-content: center;">
          <p style="color: #9090A8; font-size: 0.875rem;">Carregando...</p>
        </div>
      {:else if chartData && chartData.points.length > 0}
        <div style="height: 280px; position: relative;">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      {:else}
        <div style="height: 280px; display: flex; align-items: center; justify-content: center;">
          <p style="color: #9090A8; font-size: 0.875rem;">Sem dados para o período selecionado.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
