<script lang="ts">
  import { page } from '$app/stores';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
  import DisputeDetailPage from '$appmod/features/disputes/presentation/pages/DisputeDetailPage.svelte';

  const role = tokenStorage.getAdminRole();
  const disputeId = $page.params.id;
</script>

<DisputeDetailPage {disputeId} {role} />
