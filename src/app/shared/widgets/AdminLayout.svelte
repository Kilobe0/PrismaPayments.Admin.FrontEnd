<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import {
    LayoutDashboard, Users, CreditCard, ArrowDownToLine,
    AlertTriangle, DollarSign, BookOpen, Plug, Activity,
    UserCog, LogOut, ScanFace, ChevronDown
  } from 'lucide-svelte';
  import { hasPermission, type AdminRole } from '$appmod/shared/guards/adminGuard';
  import { env } from '$core/config/env';

  let { content, role }: { content: Snippet; role: string | null } = $props();

  let pendingKYCCount = $state(0);
  const isPendingActive = $derived($page.url.pathname === '/merchants' && $page.url.searchParams.get('verification') === 'PENDING_REVIEW');

  let txnOpen = $state(false);
  const isTxnActive = $derived($page.url.pathname.startsWith('/transactions'));

  import { apiClient } from '$appmod/services/api/apiClient';

  onMount(async () => {
    try {
      const res = await apiClient.get<any>('/api/v1/admin/merchants', { verification: 'PENDING_REVIEW', limit: 1 });
      if (res.status === 200 && res.data) {
        // Estrutura esperada: { data: [...], total: N, ... }
        pendingKYCCount = res.data.total ?? res.data.data?.length ?? 0;
      }
    } catch {
      // silencioso — badge simplesmente não aparece
    }
  });

  const baseNavItems = [
    { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/merchants', label: 'Merchants', Icon: Users },
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
      <img src="/Prisma_Pay_White.svg" alt="Prisma" style="height: 24px; display: block;" />
      <span style="display: block; font-size: 0.75rem; font-weight: 400; color: var(--color-foreground-secondary, #9090A8); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px;">
        Admin Panel
      </span>
    </div>

    <!-- Nav items -->
    <nav style="flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto;">
      {#each navItems as item}
        {@const isActive = $page.url.pathname.startsWith(item.href)}
        {@const Icon = item.Icon}
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
            transition: background 0.15s, color 0.15s, box-shadow 0.15s;
            min-height: 44px;
          "
        >
          <Icon size={16} strokeWidth={1.5} />
          {item.label}
        </a>
      {/each}

      <!-- Transacoes — submenu colapsavel -->
      <button
        type="button"
        onclick={() => (txnOpen = !txnOpen)}
        style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px 9px {isTxnActive ? '10px' : '12px'};
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: {isTxnActive ? '700' : '400'};
          color: {isTxnActive ? 'var(--color-foreground, #F6F6FF)' : 'var(--color-foreground-secondary, #9090A8)'};
          background: {isTxnActive ? 'var(--color-surface-elevated, #141420)' : 'transparent'};
          border-left: {isTxnActive ? '2px solid var(--color-brand-magenta)' : '2px solid transparent'};
          box-shadow: {isTxnActive ? 'inset 2px 0 10px rgba(255, 0, 255, 0.12)' : 'none'};
          border-top: none; border-right: none; border-bottom: none;
          cursor: pointer;
          width: 100%;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
          min-height: 44px;
        "
      >
        <CreditCard size={16} strokeWidth={1.5} />
        Transações
        <span style="margin-left: auto; display: flex; align-items: center; transition: transform 0.2s; transform: rotate({(txnOpen || isTxnActive) ? '180deg' : '0deg'});">
          <ChevronDown size={14} strokeWidth={1.5} />
        </span>
      </button>
      {#if txnOpen || isTxnActive}
        {@const isPaymentsActive = $page.url.pathname.startsWith('/transactions/payments')}
        {@const isWithdrawalsActive = $page.url.pathname.startsWith('/transactions/withdrawals')}
        <div class="subnav-group">
          <a
            href="/transactions/payments"
            class="subnav-item"
            class:subnav-item--active={isPaymentsActive}
          >
            <span class="subnav-dot" class:subnav-dot--active={isPaymentsActive}></span>
            Pagamentos
          </a>
          <a
            href="/transactions/withdrawals"
            class="subnav-item"
            class:subnav-item--active={isWithdrawalsActive}
          >
            <span class="subnav-dot" class:subnav-dot--active={isWithdrawalsActive}></span>
            Saques
          </a>
        </div>
      {/if}

      <!-- Verificações Pendentes — link dedicado com badge -->
      <a
        href="/merchants?verification=PENDING_REVIEW"
        style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px 9px {isPendingActive ? '10px' : '12px'};
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: {isPendingActive ? '700' : '400'};
          color: {isPendingActive ? 'var(--color-foreground, #F6F6FF)' : 'var(--color-foreground-secondary, #9090A8)'};
          background: {isPendingActive ? 'var(--color-surface-elevated, #141420)' : 'transparent'};
          border-left: {isPendingActive ? '2px solid var(--color-brand-magenta)' : '2px solid transparent'};
          box-shadow: {isPendingActive ? 'inset 2px 0 10px rgba(255, 0, 255, 0.12)' : 'none'};
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          min-height: 44px;
        "
      >
        <ScanFace size={16} strokeWidth={1.5} />
        Verificações Pendentes
        {#if pendingKYCCount > 0}
          <span class="nav-badge nav-badge--cyan">{pendingKYCCount}</span>
        {/if}
      </a>
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

<style>
  /* Subitem group — linha guia vertical */
  .subnav-group {
    position: relative;
    margin-left: 26px;
    padding-left: 14px;
    border-left: 1px solid rgba(255, 255, 255, 0.07);
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-top: 1px;
    margin-bottom: 2px;
  }

  .subnav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.8125rem; /* 13px — menor que o pai */
    font-weight: 400;
    color: #5a5a72;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
    min-height: 34px;
  }

  .subnav-item:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #9090a8;
  }

  .subnav-item--active {
    background: rgba(20, 20, 32, 0.8);
    color: #f6f6ff;
    font-weight: 500;
  }

  .subnav-item--active:hover {
    background: rgba(20, 20, 32, 0.8);
    color: #f6f6ff;
  }

  /* Dot indicador */
  .subnav-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #3a3a50;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .subnav-dot--active {
    background: #ff00ff;
    box-shadow: 0 0 6px rgba(255, 0, 255, 0.5);
  }

  .subnav-item:hover .subnav-dot:not(.subnav-dot--active) {
    background: #9090a8;
  }

  .nav-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    font-size: 10px;
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    line-height: 1;
    flex-shrink: 0;
    margin-left: auto;
  }
  .nav-badge--cyan {
    background: rgba(1, 250, 251, 0.12);
    color: var(--color-brand-cyan, #01FAFB);
    border: 1px solid rgba(1, 250, 251, 0.25);
  }
</style>
