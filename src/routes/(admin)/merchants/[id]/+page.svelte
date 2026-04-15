<script lang="ts">
  import { page } from '$app/stores';
  import MerchantDetailPage from '$appmod/features/merchants/presentation/pages/MerchantDetailPage.svelte';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
</script>

<MerchantDetailPage merchantId={$page.params.id} role={tokenStorage.getAdminRole()} />
