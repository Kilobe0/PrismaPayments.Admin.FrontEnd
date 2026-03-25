<script lang="ts">
  import { setContext } from 'svelte';
  import { Toaster } from 'svelte-sonner';
  import AdminLayout from '$appmod/shared/widgets/AdminLayout.svelte';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';
  import type { Snippet } from 'svelte';

  let { children, data }: { children: Snippet; data: { adminRole: string | null } } = $props();

  // Role vem do SSR (data.adminRole) mas o setContext precisa ser reativo ao sessionStorage
  // para o caso de SPA navigation (o SSR já validou; aqui apenas disponibilizamos no cliente)
  const roleFromSSR = data.adminRole;

  setContext('adminRole', roleFromSSR ?? tokenStorage.getAdminRole());
</script>

<AdminLayout role={roleFromSSR ?? tokenStorage.getAdminRole()}>
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
