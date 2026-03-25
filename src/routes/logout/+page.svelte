<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
  import { onMount } from 'svelte';

  onMount(() => {
    // Clear sessionStorage and submit the form to clear server-side cookies
    tokenStorage.clearTokens();
  });
</script>

<form method="POST" use:enhance={() => {
  return async ({ result }) => {
    tokenStorage.clearTokens();
    await goto('/login');
  };
}}>
  <button type="submit" style="display:none">Logout</button>
</form>

<script module>
  // Auto-submit on mount via JS
</script>
