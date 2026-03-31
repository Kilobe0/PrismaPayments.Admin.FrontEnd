<script lang="ts">
  import MerchantsListPage from '$appmod/features/merchants/presentation/pages/MerchantsListPage.svelte';
  import type { LayoutData } from '../$types';

  let { data }: { data: LayoutData } = $props();
</script>

<MerchantsListPage role={data.adminRole ?? null} />
