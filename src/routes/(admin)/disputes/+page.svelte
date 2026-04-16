<script lang="ts">
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
  import DisputesListPage from '$appmod/features/disputes/presentation/pages/DisputesListPage.svelte';

  const role = tokenStorage.getAdminRole();
</script>

<DisputesListPage {role} />
