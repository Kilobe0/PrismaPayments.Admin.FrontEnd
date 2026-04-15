<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
  import { onMount } from 'svelte';

  let formEl: HTMLFormElement;

  onMount(() => {
    tokenStorage.clearTokens();
    formEl.requestSubmit();
  });
</script>

<form bind:this={formEl} method="POST" use:enhance={() => {
  return async () => {
    tokenStorage.clearTokens();
    await goto('/login');
  };
}}>
  <button type="submit" style="display:none">Logout</button>
</form>
