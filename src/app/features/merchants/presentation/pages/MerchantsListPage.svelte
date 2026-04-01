<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import { createMerchantListController } from '../controllers/merchantListController.svelte';
  import DataTable from '$appmod/shared/widgets/DataTable.svelte';
  import StatusBadge from '$appmod/shared/widgets/StatusBadge.svelte';
  import SearchInput from '$appmod/shared/widgets/filters/SearchInput.svelte';
  import SelectFilter from '$appmod/shared/widgets/filters/SelectFilter.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Button } from '$lib/components/ui/button';
  import { formatDate, formatDocument } from '$appmod/shared/utils/formatters';
  import { hasPermission, type AdminRole } from '$appmod/shared/guards/adminGuard';
  import type { MerchantStatus, MerchantListItem } from '$appmod/features/merchants/domain/entities/Merchant';
  import CreateMerchantSheet from '../components/CreateMerchantSheet.svelte';

  let { role }: { role: string | null } = $props();

  const ctrl = createMerchantListController();

  let showCreateSheet = $state(false);

  const STATUS_TABS: { key: MerchantStatus | 'ALL'; label: string }[] = [
    { key: 'ALL',       label: 'Todos' },
    { key: 'PENDING',   label: 'Pendente' },
    { key: 'ACTIVE',    label: 'Ativo' },
    { key: 'SUSPENDED', label: 'Suspenso' },
    { key: 'BLOCKED',   label: 'Bloqueado' }
  ];

  const VERIFICATION_OPTIONS = [
    { value: 'ALL',            label: 'Todas verificações' },
    { value: 'UNVERIFIED',     label: 'Não verificado' },
    { value: 'PENDING_REVIEW', label: 'Pendente revisão' },
    { value: 'VERIFIED',       label: 'Verificado' },
    { value: 'REJECTED',       label: 'Rejeitado' }
  ];

  // Colunas para o DataTable (usando ColumnDef do @tanstack/table-core)
  const columns: ColumnDef<MerchantListItem, unknown>[] = [
    { id: 'legalName',         header: 'Razão Social',   accessorKey: 'legalName' },
    { id: 'documentNumber',    header: 'Documento',      accessorKey: 'documentNumber' },
    { id: 'email',             header: 'E-mail',         accessorKey: 'email' },
    { id: 'status',            header: 'Status',         accessorKey: 'status' },
    { id: 'verificationStatus', header: 'Verificação',   accessorKey: 'verificationStatus' },
    { id: 'createdAt',         header: 'Cadastro',       accessorKey: 'createdAt' }
  ];

  const isAdmin = $derived(hasPermission(role as AdminRole, 'ADMIN'));

  // Dados formatados para exibição na tabela
  const tableData = $derived(
    ctrl.state.merchants.map(m => ({
      ...m,
      documentNumber: formatDocument(m.documentNumber, m.documentType),
      createdAt: formatDate(m.createdAt)
    }))
  );

  // Lê query param de verificação da URL
  onMount(() => {
    const verif = $page.url.searchParams.get('verification');
    if (verif) ctrl.setVerification(verif as any);
    ctrl.loadMerchants();
    ctrl.loadPendingKYCCount();
    ctrl.loadCounts();
  });

  function handleRowClick(row: Row<MerchantListItem>) {
    goto(`/merchants/${row.original.id}`);
  }
</script>

<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">Merchants</h1>
      <p class="page-subtitle">Gestão de estabelecimentos</p>
    </div>
    {#if isAdmin}
      <Button variant="default" class="btn-new" onclick={() => (showCreateSheet = true)}>
        + Novo Merchant
      </Button>
    {/if}
  </div>

  <!-- Tabs de status -->
  <div class="status-tabs">
    {#each STATUS_TABS as tab}
      <button
        type="button"
        class="status-tab"
        class:active={ctrl.state.status === tab.key}
        onclick={() => ctrl.setStatus(tab.key)}
      >
        {tab.label}
        {#if tab.key === 'ALL'}
          <span class="tab-count">{ctrl.state.total}</span>
        {:else if ctrl.state.counts[tab.key] !== undefined}
          <span class="tab-count">{ctrl.state.counts[tab.key]}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Filtros -->
  <div class="filters">
    <SearchInput
      value={ctrl.state.search}
      placeholder="Buscar por nome, documento, email..."
      onSearch={(v: string) => ctrl.setSearch(v)}
    />
    <SelectFilter
      value={ctrl.state.verification}
      options={VERIFICATION_OPTIONS}
      onChange={(v: string) => ctrl.setVerification(v as any)}
    />
  </div>

  <!-- Tabela -->
  {#if ctrl.state.loading}
    <div class="skeleton-table">
      {#each Array(8) as _}
        <Skeleton class="skeleton-row" />
      {/each}
    </div>
  {:else if ctrl.state.error}
    <div class="error-state">
      <span>{ctrl.state.error}</span>
      <Button onclick={() => ctrl.loadMerchants()} variant="outline">Tentar novamente</Button>
    </div>
  {:else}
    <DataTable
      {columns}
      data={tableData}
      pageSize={ctrl.state.limit}
      cellSnippet={cellRenderer}
    >
    </DataTable>

    <!-- Paginação server-side -->
    {#if ctrl.state.total > ctrl.state.limit}
      <div class="pagination">
        <Button
          variant="outline"
          disabled={ctrl.state.page === 1}
          onclick={() => ctrl.setPage(ctrl.state.page - 1)}
        >Anterior</Button>
        <span class="page-info">
          Página {ctrl.state.page} · {ctrl.state.total} resultados
        </span>
        <Button
          variant="outline"
          disabled={ctrl.state.page * ctrl.state.limit >= ctrl.state.total}
          onclick={() => ctrl.setPage(ctrl.state.page + 1)}
        >Próxima</Button>
      </div>
    {/if}
  {/if}
</div>

<CreateMerchantSheet
  bind:open={showCreateSheet}
  onCreated={() => ctrl.loadMerchants()}
/>

{#snippet cellRenderer({ row, columnId }: { row: Row<MerchantListItem>; columnId: string })}
  {#if columnId === 'status'}
    <StatusBadge status={row.original.status} />
  {:else if columnId === 'verificationStatus'}
    <StatusBadge status={row.original.verificationStatus} />
  {:else}
    {String((row.original as Record<string, unknown>)[columnId] ?? '—')}
  {/if}
{/snippet}

<style>
  .page {
    padding: 32px 36px;
    max-width: 1200px;
    margin: 0 auto;
    animation: enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes enter {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
  }
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
  .status-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding-bottom: 0;
  }
  .status-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    background: transparent;
    color: rgba(218, 212, 196, 0.45);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.18s, border-color 0.18s;
    margin-bottom: -1px;
  }
  .status-tab:hover {
    color: rgba(218, 212, 196, 0.75);
  }
  .status-tab.active {
    color: var(--color-brand-cyan, #01FAFB);
    border-bottom-color: var(--color-brand-cyan, #01FAFB);
  }
  .tab-count {
    background: rgba(1, 250, 251, 0.10);
    color: var(--color-brand-cyan, #01FAFB);
    border: 1px solid rgba(1, 250, 251, 0.20);
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10px;
    min-width: 18px;
    text-align: center;
  }
  .filters {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    align-items: center;
  }
  .skeleton-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  :global(.skeleton-row) {
    height: 44px;
    border-radius: 4px;
    width: 100%;
  }
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 48px;
    color: rgba(218, 212, 196, 0.45);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
  }
  .page-info {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(218, 212, 196, 0.45);
  }
</style>
