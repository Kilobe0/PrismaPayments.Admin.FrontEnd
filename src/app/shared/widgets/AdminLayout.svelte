<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import type { Snippet } from 'svelte';
  import {
    LayoutDashboard, Users, CreditCard, ArrowDownToLine,
    AlertTriangle, DollarSign, BookOpen, Plug, Activity,
    UserCog, LogOut
  } from 'lucide-svelte';
  import { hasPermission, type AdminRole } from '$appmod/shared/guards/adminGuard';

  let { content, role }: { content: Snippet; role: string | null } = $props();

  const baseNavItems = [
    { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/merchants', label: 'Merchants', Icon: Users },
    { href: '/transactions/payments', label: 'Pagamentos', Icon: CreditCard },
    { href: '/transactions/withdrawals', label: 'Saques', Icon: ArrowDownToLine },
    { href: '/disputes', label: 'Disputas', Icon: AlertTriangle },
    { href: '/fees', label: 'Taxas', Icon: DollarSign },
    { href: '/audit', label: 'Auditoria', Icon: BookOpen },
    { href: '/providers', label: 'Provedores', Icon: Plug },
    { href: '/diagnostics', label: 'Diagnósticos', Icon: Activity },
  ];

  const adminOnlyItem = { href: '/admin-users', label: 'Admins', Icon: UserCog };

  // RBAC-02: item de menu SUPER_ADMIN ausente do DOM para outros roles
  const navItems = $derived(
    hasPermission(role as AdminRole, 'SUPER_ADMIN')
      ? [...baseNavItems, adminOnlyItem]
      : baseNavItems
  );
</script>

<div class="flex min-h-screen">
  <!-- Sidebar: 240px fixo, background #0A0A0F -->
  <aside style="width: 240px; min-width: 240px; background: var(--color-background-subtle, #0A0A0F); border-right: 1px solid var(--color-border, rgba(255,255,255,0.08)); display: flex; flex-direction: column; flex-shrink: 0;">
    <!-- Logo area -->
    <div style="padding: 16px 16px 24px; border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));">
      <span style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; background: linear-gradient(135deg, #FF00FF, #01FAFB); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block; text-wrap: balance;">
        PRISMA
      </span>
      <span style="display: block; font-size: 0.75rem; font-weight: 400; color: var(--color-foreground-secondary, #9090A8); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">
        Admin Panel
      </span>
    </div>

    <!-- Nav items -->
    <nav style="flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto;">
      {#each navItems as item}
        {@const isActive = $page.url.pathname.startsWith(item.href)}
        <a
          href={item.href}
          style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 12px 9px {isActive ? '10px' : '12px'};
            border-radius: 10px;
            font-size: 0.875rem;
            font-weight: {isActive ? '700' : '400'};
            color: {isActive ? 'var(--color-foreground, #F6F6FF)' : 'var(--color-foreground-secondary, #9090A8)'};
            background: {isActive ? 'var(--color-surface-elevated, #141420)' : 'transparent'};
            border-left: {isActive ? '2px solid var(--color-brand-magenta)' : '2px solid transparent'};
            box-shadow: {isActive ? 'inset 2px 0 10px rgba(255, 0, 255, 0.12)' : 'none'};
            text-decoration: none;
            transition: background 0.15s, color 0.15s;
            min-height: 44px;
          "
        >
          <svelte:component this={item.Icon} size={16} strokeWidth={1.5} />
          {item.label}
        </a>
      {/each}
    </nav>

    <!-- Logout -->
    <div style="padding: 16px 12px; border-top: 1px solid var(--color-border, rgba(255,255,255,0.08));">
      <form method="POST" action="/logout" use:enhance>
        <button
          type="submit"
          style="
            display: flex; align-items: center; gap: 8px;
            padding: 9px 12px; border-radius: 10px;
            font-size: 0.875rem; font-weight: 400;
            color: var(--color-foreground-secondary, #9090A8);
            background: transparent; border: none; cursor: pointer;
            width: 100%; min-height: 44px;
            transition: background 0.15s, color 0.15s;
          "
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sair
        </button>
      </form>
    </div>
  </aside>

  <!-- Main content -->
  <main style="flex: 1; overflow: auto; background: var(--color-background, #070707);">
    {@render content()}
  </main>
</div>
