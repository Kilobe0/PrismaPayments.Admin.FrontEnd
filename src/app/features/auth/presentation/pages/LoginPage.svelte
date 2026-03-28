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
  let emailFocused = $state(false);
  let passwordFocused = $state(false);
</script>

<div style="
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #070707;
  position: relative;
  overflow: hidden;
  font-family: var(--font-body);
">
  <!-- Ambient glows -->
  <div style="
    position: absolute;
    width: 600px; height: 600px;
    top: -160px; left: -160px;
    background: radial-gradient(circle, rgba(255,0,255,0.07) 0%, transparent 70%);
    pointer-events: none;
  "></div>
  <div style="
    position: absolute;
    width: 500px; height: 500px;
    bottom: -120px; right: -120px;
    background: radial-gradient(circle, rgba(1,250,251,0.06) 0%, transparent 70%);
    pointer-events: none;
  "></div>

  <!-- Card -->
  <div style="
    position: relative;
    width: 100%;
    max-width: 400px;
    margin: 24px;
    padding: 40px;
    background: #0F0F18;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.70), 0 0 0 1px rgba(255,255,255,0.03) inset;
  ">
    <!-- Top accent line -->
    <div style="
      position: absolute;
      top: 0; left: 40px; right: 40px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,0,255,0.4), rgba(1,250,251,0.4), transparent);
      border-radius: 9999px;
    "></div>

    <!-- Logo area -->
    <div style="text-align: center; margin-bottom: 36px;">
      <!-- Prism mark -->
      <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="prism-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FF00FF"/>
              <stop offset="100%" stop-color="#01FAFB"/>
            </linearGradient>
          </defs>
          <!-- Outer diamond -->
          <path d="M24 4L44 24L24 44L4 24L24 4Z" stroke="url(#prism-grad)" stroke-width="1.5" fill="none"/>
          <!-- Inner diamond -->
          <path d="M24 12L36 24L24 36L12 24L24 12Z" stroke="url(#prism-grad)" stroke-width="1" fill="rgba(255,0,255,0.06)"/>
          <!-- Center dot -->
          <circle cx="24" cy="24" r="3" fill="url(#prism-grad)"/>
          <!-- Facet lines -->
          <line x1="24" y1="4" x2="24" y2="12" stroke="url(#prism-grad)" stroke-width="1" opacity="0.5"/>
          <line x1="44" y1="24" x2="36" y2="24" stroke="url(#prism-grad)" stroke-width="1" opacity="0.5"/>
          <line x1="24" y1="44" x2="24" y2="36" stroke="url(#prism-grad)" stroke-width="1" opacity="0.5"/>
          <line x1="4" y1="24" x2="12" y2="24" stroke="url(#prism-grad)" stroke-width="1" opacity="0.5"/>
        </svg>
      </div>

      <!-- Wordmark -->
      <div style="display: flex; align-items: baseline; justify-content: center; gap: 8px; margin-bottom: 6px;">
        <span style="
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #FF00FF 0%, #01FAFB 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">PRISMA</span>
        <span style="
          font-family: var(--font-body);
          font-size: 0.7rem;
          font-weight: 600;
          color: #3A3A50;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          padding: 3px 8px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9999px;
        ">Admin</span>
      </div>
      <p style="color: #3A3A50; font-size: 0.8125rem; margin: 0; letter-spacing: 0.01em;">
        Painel de controle interno
      </p>
    </div>

    <!-- Form -->
    <form
      method="POST"
      action="?/login"
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
      style="display: flex; flex-direction: column; gap: 16px;"
    >
      <!-- Email -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label for="email" style="
          font-size: 0.6875rem;
          font-weight: 600;
          color: #9090A8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        ">E-mail</label>
        <input
          id="email"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="admin@prisma.com"
          onfocus={() => emailFocused = true}
          onblur={() => emailFocused = false}
          style="
            background: #0A0A0F;
            border: 1px solid {emailFocused ? 'rgba(255,0,255,0.35)' : 'rgba(255,255,255,0.07)'};
            border-radius: 12px;
            padding: 13px 16px;
            color: #F6F6FF;
            font-size: 0.9375rem;
            font-family: var(--font-body);
            outline: none;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.15s;
            box-shadow: {emailFocused ? '0 0 0 3px rgba(255,0,255,0.08)' : 'none'};
          "
        />
      </div>

      <!-- Password -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label for="password" style="
          font-size: 0.6875rem;
          font-weight: 600;
          color: #9090A8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        ">Senha</label>
        <input
          id="password"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="••••••••"
          onfocus={() => passwordFocused = true}
          onblur={() => passwordFocused = false}
          style="
            background: #0A0A0F;
            border: 1px solid {passwordFocused ? 'rgba(255,0,255,0.35)' : 'rgba(255,255,255,0.07)'};
            border-radius: 12px;
            padding: 13px 16px;
            color: #F6F6FF;
            font-size: 0.9375rem;
            font-family: var(--font-body);
            outline: none;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.15s;
            box-shadow: {passwordFocused ? '0 0 0 3px rgba(255,0,255,0.08)' : 'none'};
          "
        />
      </div>

      {#if form?.error}
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          color: #FF3B5C;
          font-size: 0.8125rem;
          background: rgba(255,59,92,0.08);
          border: 1px solid rgba(255,59,92,0.18);
          padding: 10px 14px;
          border-radius: 10px;
        ">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="#FF3B5C"/>
            <line x1="7" y1="4" x2="7" y2="8" stroke="#FF3B5C" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="7" cy="10" r="0.75" fill="#FF3B5C"/>
          </svg>
          {form.error}
        </div>
      {/if}

      <!-- Submit -->
      <button
        type="submit"
        disabled={loading}
        style="
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255,0,255,0.15) 0%, rgba(1,250,251,0.10) 100%);
          border: 1px solid rgba(255,0,255,0.35);
          border-radius: 12px;
          padding: 14px;
          color: #F6F6FF;
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: var(--font-body);
          cursor: {loading ? 'not-allowed' : 'pointer'};
          margin-top: 8px;
          opacity: {loading ? '0.5' : '1'};
          width: 100%;
          letter-spacing: 0.01em;
          transition: opacity 0.15s, box-shadow 0.15s;
          box-shadow: 0 0 20px rgba(255,0,255,0.12);
        "
        onmouseenter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 0 28px rgba(255,0,255,0.22)'; }}
        onmouseleave={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,255,0.12)'; }}
      >
        {loading ? 'Autenticando...' : 'Entrar'}
      </button>
    </form>
  </div>
</div>
