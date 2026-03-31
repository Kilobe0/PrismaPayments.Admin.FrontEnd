<script lang="ts">
  import { page } from '$app/stores';
  import MerchantDetailPage from '$appmod/features/merchants/presentation/pages/MerchantDetailPage.svelte';

  let { data } = $props<{ data: { adminRole?: string | null } }>();
</script>

<MerchantDetailPage merchantId={$page.params.id} role={data.adminRole ?? null} />
