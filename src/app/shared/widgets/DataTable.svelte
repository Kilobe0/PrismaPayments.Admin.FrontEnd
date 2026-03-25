<script lang="ts" generics="T">
  import {
    createTable,
    getCoreRowModel,
    getSortedRowModel,
    type ColumnDef,
    type SortingState,
    type Row
  } from '@tanstack/table-core';
  import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';
  import Pagination from './Pagination.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    columns: ColumnDef<T, unknown>[];
    data: T[];
    pageSize?: number;
    loading?: boolean;
    /** Snippet customizado para células: recebe a row e o columnId */
    cellSnippet?: Snippet<[{ row: Row<T>; columnId: string }]>;
  }

  let {
    columns,
    data,
    pageSize = 20,
    loading = false,
    cellSnippet
  }: Props = $props();

  let sorting = $state<SortingState>([]);
  let currentPage = $state(1);

  const totalPages = $derived(Math.max(1, Math.ceil(data.length / pageSize)));

  // Reset to page 1 when data changes
  $effect(() => {
    void data.length;
    currentPage = 1;
  });

  const table = $derived(createTable({
    data,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize
      }
    },
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
  }));

  const visibleRows = $derived(
    table.getRowModel().rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );

  const SKELETON_COUNT = 5;
</script>

<div
  style="
    background: var(--color-surface, #0F0F18);
    border: 1px solid var(--color-border, rgba(255,255,255,0.08));
    border-radius: var(--radius-lg, 16px);
    box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.50));
    overflow: hidden;
  "
>
  <div style="overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse;">
      <!-- Header -->
      <thead>
        {#each table.getHeaderGroups() as headerGroup}
          <tr
            style="
              background: var(--color-background-subtle, #0A0A0F);
              border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
            "
          >
            {#each headerGroup.headers as header}
              <th
                onclick={header.column.getToggleSortingHandler()}
                style="
                  padding: 12px 16px;
                  text-align: left;
                  font-size: 0.75rem;
                  font-weight: 400;
                  color: var(--color-foreground-secondary, #9090A8);
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  white-space: nowrap;
                  cursor: {header.column.getCanSort() ? 'pointer' : 'default'};
                  user-select: none;
                "
              >
                <div style="display: inline-flex; align-items: center; gap: 4px;">
                  {#if typeof header.column.columnDef.header === 'string'}
                    {header.column.columnDef.header}
                  {/if}
                  {#if header.column.getCanSort()}
                    {#if header.column.getIsSorted() === 'asc'}
                      <ChevronUp size={16} strokeWidth={1.5} style="color: var(--color-foreground, #F6F6FF);" />
                    {:else if header.column.getIsSorted() === 'desc'}
                      <ChevronDown size={16} strokeWidth={1.5} style="color: var(--color-foreground, #F6F6FF);" />
                    {:else}
                      <ChevronsUpDown size={16} strokeWidth={1.5} style="color: var(--color-foreground-secondary, #9090A8);" />
                    {/if}
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
        {/each}
      </thead>

      <!-- Body -->
      <tbody>
        {#if loading}
          <!-- Skeleton rows -->
          {#each Array(SKELETON_COUNT) as _, i}
            <tr>
              {#each columns as _col}
                <td style="padding: 12px 16px;">
                  <div
                    style="
                      height: 16px;
                      background: var(--color-surface-elevated, #141420);
                      border-radius: 4px;
                      width: {60 + (i * 13 % 30)}%;
                      animation: skeleton-pulse 1.5s ease-in-out infinite;
                    "
                  ></div>
                </td>
              {/each}
            </tr>
          {/each}
        {:else if data.length === 0}
          <!-- Empty state -->
          <tr>
            <td
              colspan={columns.length}
              style="
                padding: 48px 24px;
                text-align: center;
              "
            >
              <p
                style="
                  font-family: var(--font-display);
                  font-size: 1rem;
                  font-weight: 700;
                  color: var(--color-foreground, #F6F6FF);
                  margin: 0 0 8px;
                "
              >
                Nenhum resultado
              </p>
              <p
                style="
                  font-size: 0.875rem;
                  color: var(--color-foreground-secondary, #9090A8);
                  margin: 0;
                "
              >
                Não há dados para exibir com os filtros aplicados.
              </p>
            </td>
          </tr>
        {:else}
          {#each visibleRows as row}
            <tr
              style="
                border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
                transition: background 0.15s;
              "
              onmouseenter={(e) => (e.currentTarget.style.background = 'var(--color-surface-elevated, #141420)')}
              onmouseleave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {#each row.getVisibleCells() as cell}
                <td
                  style="
                    padding: 12px 16px;
                    font-size: 0.875rem;
                    color: var(--color-foreground, #F6F6FF);
                    white-space: nowrap;
                    font-variant-numeric: tabular-nums;
                  "
                >
                  {#if cellSnippet}
                    {@render cellSnippet({ row, columnId: cell.column.id })}
                  {:else}
                    {String(cell.getValue() ?? '')}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  {#if !loading && data.length > 0}
    <Pagination
      {currentPage}
      {totalPages}
      onPageChange={(p) => (currentPage = p)}
    />
  {/if}
</div>

<style>
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.8; }
  }
</style>
