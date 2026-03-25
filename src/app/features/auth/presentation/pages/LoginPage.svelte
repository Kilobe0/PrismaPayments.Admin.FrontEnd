<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { tokenStorage } from '$appmod/services/storage/tokenStorage';

  interface Props {
    form?: {
      success?: boolean;
      accessToken?: string;
      refreshToken?: string;
      error?: string;
    } | null;
  }

  let { form }: Props = $props();
  let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center" style="background: #070707;">
  <div class="w-full max-w-md p-8" style="background: #0F0F18; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; box-shadow: 0 16px 48px rgba(0,0,0,0.60);">
    <!-- Logo / Brand -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center gap-2 mb-2">
        <span style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #FF00FF, #01FAFB); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          PRISMA
        </span>
        <span style="font-size: 0.75rem; font-weight: 500; color: #9090A8; text-transform: uppercase; letter-spacing: 0.1em;">
          Admin
        </span>
      </div>
      <p style="color: #9090A8; font-size: 0.875rem;">
        Painel Administrativo
      </p>
    </div>

    <!-- Form -->
    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ result, update }) => {
          loading = false;
          if (result.type === 'success' && result.data?.accessToken) {
            tokenStorage.setTokens(
              result.data.accessToken as string,
              result.data.refreshToken as string
            );
            await goto('/dashboard');
            return;
          }
          await update();
        };
      }}
      class="flex flex-col gap-4"
    >
      <div class="flex flex-col gap-1">
        <label for="email" style="font-size: 0.75rem; font-weight: 500; color: #9090A8; text-transform: uppercase; letter-spacing: 0.05em;">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="admin@prisma.com"
          style="background: #1A1A28; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 16px; color: #F6F6FF; font-size: 1rem; outline: none; width: 100%; box-sizing: border-box;"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="password" style="font-size: 0.75rem; font-weight: 500; color: #9090A8; text-transform: uppercase; letter-spacing: 0.05em;">
          Senha
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="••••••••"
          style="background: #1A1A28; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 16px; color: #F6F6FF; font-size: 1rem; outline: none; width: 100%; box-sizing: border-box;"
        />
      </div>

      {#if form?.error}
        <p style="color: #FF3B5C; font-size: 0.875rem; background: rgba(255, 59, 92, 0.10); padding: 10px 14px; border-radius: 8px; margin: 0;">
          {form.error}
        </p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        style="background: linear-gradient(135deg, #0A0A0F 0%, #18111A 100%); border: 1px solid #FF00FF; border-radius: 12px; padding: 14px; color: #F6F6FF; font-size: 1rem; font-weight: 600; cursor: {loading ? 'not-allowed' : 'pointer'}; margin-top: 8px; opacity: {loading ? '0.6' : '1'}; width: 100%;"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  </div>
</div>
