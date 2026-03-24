<script lang="ts">
  import MerchantDetailPage from '$appmod/features/merchants/management/presentation/pages/MerchantDetailPage.svelte';

  let { params } = $props<{ params: { id: string } }>();
</script>

<MerchantDetailPage merchantId={params.id} />
