<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';

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
    <Button
      variant="outline"
      size="icon"
      disabled={currentPage <= 1}
      onclick={() => onPageChange(currentPage - 1)}
      style="min-height: 44px; min-width: 44px;"
    >
      ←
    </Button>

    <Button
      variant="outline"
      size="icon"
      disabled={currentPage >= totalPages}
      onclick={() => onPageChange(currentPage + 1)}
      style="min-height: 44px; min-width: 44px;"
    >
      →
    </Button>
  </div>
</div>
