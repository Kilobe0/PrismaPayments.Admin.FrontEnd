<script lang="ts">
  import { onMount } from 'svelte';
  import { DashboardService } from '../../services/DashboardService';
  import { DashboardRepository } from '../../data/repositories/DashboardRepository';
  import { formatCurrency } from '$appmod/shared/utils/formatters';
  import type { AdminMetrics } from '../../domain/entities/AdminMetrics';

  let metrics = $state<AdminMetrics | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

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

  const metricCards = $derived(metrics ? [
    { label: 'VOLUME TOTAL', value: formatCurrency(metrics.totalVolume), color: '#01FAFB' },
    { label: 'TRANSAÇÕES HOJE', value: metrics.todayTransactions.toLocaleString('pt-BR'), color: '#01FAFB' },
    { label: 'TAXAS COLETADAS', value: formatCurrency(metrics.totalFeesCollected), color: '#00E676' },
    { label: 'MERCHANTS', value: metrics.totalMerchants.toLocaleString('pt-BR'), color: '#9090A8' }
  ] : []);
</script>

<div style="padding: 32px; max-width: 1080px; margin: 0 auto;">
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
    <div style="background: rgba(255,59,92,0.10); border: 1px solid rgba(255,59,92,0.2); border-radius: 12px; padding: 16px;">
      <p style="color: #FF3B5C; margin: 0;">{error}</p>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px;">
      {#each metricCards as card}
        <div style="background: #0F0F18; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.50);">
          <p style="font-size: 0.75rem; font-weight: 500; color: #9090A8; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;">
            {card.label}
          </p>
          <p style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: {card.color}; margin: 0;">
            {card.value}
          </p>
        </div>
      {/each}
    </div>
  {/if}
</div>
