<script lang="ts">
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';

  let { content }: { content: Snippet } = $props();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/merchants', label: 'Merchants', icon: '👥' },
    { href: '/transactions/payments', label: 'Pagamentos', icon: '💳' },
    { href: '/transactions/withdrawals', label: 'Saques', icon: '💸' },
    { href: '/disputes', label: 'Disputas', icon: '⚠️' },
    { href: '/fees', label: 'Taxas', icon: '💰' },
    { href: '/audit', label: 'Auditoria', icon: '📋' },
    { href: '/providers', label: 'Provedores', icon: '🔌' },
    { href: '/diagnostics', label: 'Diagnósticos', icon: '🔍' },
    { href: '/admin-users', label: 'Admins', icon: '👤' },
  ];
</script>

<div class="flex min-h-screen">
  <!-- Sidebar -->
  <aside style="width: 240px; background: #0A0A0F; border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; padding: 24px 0; flex-shrink: 0;">
    <!-- Logo -->
    <div style="padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
      <span style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; background: linear-gradient(135deg, #FF00FF, #01FAFB); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        PRISMA
      </span>
      <span style="display: block; font-size: 0.625rem; font-weight: 500; color: #9090A8; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px;">
        Admin Panel
      </span>
    </div>

    <!-- Nav -->
    <nav style="flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px;">
      {#each navItems as item}
        {@const isActive = $page.url.pathname.startsWith(item.href)}
        <a
          href={item.href}
          style="
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 12px;
            border-radius: 10px;
            font-size: 0.875rem;
            font-weight: {isActive ? '600' : '400'};
            color: {isActive ? '#F6F6FF' : '#9090A8'};
            background: {isActive ? '#141420' : 'transparent'};
            text-decoration: none;
            transition: background 0.15s, color 0.15s;
          "
        >
          <span style="font-size: 1rem;">{item.icon}</span>
          {item.label}
        </a>
      {/each}
    </nav>

    <!-- Logout -->
    <div style="padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08);">
      <form method="POST" action="/login?/logout">
        <button
          type="submit"
          style="display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; font-size: 0.875rem; color: #9090A8; background: transparent; border: none; cursor: pointer; width: 100%;"
        >
          <span>🚪</span>
          Sair
        </button>
      </form>
    </div>
  </aside>

  <!-- Main content -->
  <main style="flex: 1; overflow: auto; background: #070707;">
    {@render content()}
  </main>
</div>
