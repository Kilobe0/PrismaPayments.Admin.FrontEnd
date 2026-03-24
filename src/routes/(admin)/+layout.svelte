<script lang="ts">
  import AdminLayout from '$appmod/shared/widgets/AdminLayout.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<AdminLayout>
  {#snippet content()}
    {@render children()}
  {/snippet}
</AdminLayout>
