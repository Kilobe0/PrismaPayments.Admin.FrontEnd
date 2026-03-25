<script lang="ts">
  interface Props {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }

  let { currentPage, totalPages, onPageChange }: Props = $props();
</script>

<div
  style="
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid var(--color-border, rgba(255,255,255,0.08));
  "
>
  <span
    style="
      font-size: 0.875rem;
      color: var(--color-foreground-secondary, #9090A8);
      font-variant-numeric: tabular-nums;
    "
  >
    Página {currentPage} de {totalPages}
  </span>

  <div style="display: flex; gap: 8px;">
    <button
      type="button"
      onclick={() => onPageChange(currentPage - 1)}
      disabled={currentPage <= 1}
      style="
        background: transparent;
        border: 1px solid var(--color-border, rgba(255,255,255,0.08));
        border-radius: var(--radius-md, 12px);
        padding: 6px 12px;
        color: {currentPage <= 1 ? 'var(--color-foreground-disabled, #3A3A50)' : 'var(--color-foreground-secondary, #9090A8)'};
        font-size: 0.875rem;
        cursor: {currentPage <= 1 ? 'not-allowed' : 'pointer'};
        min-height: 44px;
        min-width: 44px;
        transition: background 0.15s;
      "
    >
      ←
    </button>

    <button
      type="button"
      onclick={() => onPageChange(currentPage + 1)}
      disabled={currentPage >= totalPages}
      style="
        background: transparent;
        border: 1px solid var(--color-border, rgba(255,255,255,0.08));
        border-radius: var(--radius-md, 12px);
        padding: 6px 12px;
        color: {currentPage >= totalPages ? 'var(--color-foreground-disabled, #3A3A50)' : 'var(--color-foreground-secondary, #9090A8)'};
        font-size: 0.875rem;
        cursor: {currentPage >= totalPages ? 'not-allowed' : 'pointer'};
        min-height: 44px;
        min-width: 44px;
        transition: background 0.15s;
      "
    >
      →
    </button>
  </div>
</div>
