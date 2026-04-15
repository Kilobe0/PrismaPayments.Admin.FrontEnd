<script lang="ts">
  import MerchantsListPage from '$appmod/features/merchants/presentation/pages/MerchantsListPage.svelte';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
</script>

<MerchantsListPage role={tokenStorage.getAdminRole()} />
