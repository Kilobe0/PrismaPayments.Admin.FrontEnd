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

  onMount(async () => {
    const result = await service.getMetrics();
    if (result.ok) {
      metrics = result.value;
    } else {
      error = result.failure.message;
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
    { label: 'VOLUME TOTAL', value: formatCurrency(metrics.totalVolume), color: '#01FAFB' },
    { label: 'TRANSAÇÕES HOJE', value: metrics.todayTransactions.toLocaleString('pt-BR'), color: '#01FAFB' },
    { label: 'TAXAS COLETADAS', value: formatCurrency(metrics.totalFeesCollected), color: '#00E676' },
    { label: 'MERCHANTS', value: metrics.totalMerchants.toLocaleString('pt-BR'), color: '#9090A8' }
  ] : []);

  const barChartData = $derived(chartData ? {
    labels: chartData.points.map(p => p.label),
    datasets: [
      {
        label: 'Volume (R$)',
        data: chartData.points.map(p => p.volume / 100),
        backgroundColor: 'rgba(1, 250, 251, 0.8)',
        borderColor: 'rgba(1, 250, 251, 1)',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Transações',
        data: chartData.points.map(p => p.transactions),
        backgroundColor: 'rgba(255, 0, 255, 0.8)',
        borderColor: 'rgba(255, 0, 255, 1)',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'yTransactions'
      }
    ]
  } : { labels: [], datasets: [] });

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9090A8',
          font: { size: 12 }
        }
      },
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
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9090A8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9090A8', font: { size: 11 } },
        position: 'left' as const
      },
      yTransactions: {
        grid: { drawOnChartArea: false },
        ticks: { color: '#9090A8', font: { size: 11 } },
        position: 'right' as const
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
          <p style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: {card.color}; margin: 0;">
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
