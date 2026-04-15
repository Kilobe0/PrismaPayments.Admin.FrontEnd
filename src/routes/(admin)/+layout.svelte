<script lang="ts">
  import { setContext } from 'svelte';
  import { Toaster } from 'svelte-sonner';
  import AdminLayout from '$appmod/shared/widgets/AdminLayout.svelte';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const role = tokenStorage.getAdminRole();

  setContext('adminRole', role);
</script>

<AdminLayout {role}>
  {#snippet content()}
    {@render children()}
  {/snippet}
</AdminLayout>

<Toaster
  position="bottom-right"
  theme="dark"
  toastOptions={{
    style: 'background: #0F0F18; border: 1px solid rgba(255,255,255,0.08); color: #F6F6FF;'
  }}
/>
