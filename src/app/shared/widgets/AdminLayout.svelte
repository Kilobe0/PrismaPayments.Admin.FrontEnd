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

  const mainNavItems = [
    { href: '/dashboard',              label: 'Dashboard',   Icon: LayoutDashboard },
    { href: '/merchants',              label: 'Merchants',   Icon: Users },
    { href: '/transactions/payments',  label: 'Pagamentos',  Icon: CreditCard },
    { href: '/transactions/withdrawals', label: 'Saques',    Icon: ArrowDownToLine },
    { href: '/disputes',               label: 'Disputas',    Icon: AlertTriangle },
  ];

  const configNavItems = [
    { href: '/fees',        label: 'Taxas',        Icon: DollarSign },
    { href: '/audit',       label: 'Auditoria',    Icon: BookOpen },
    { href: '/providers',   label: 'Provedores',   Icon: Plug },
    { href: '/diagnostics', label: 'Diagnósticos', Icon: Activity },
  ];

  const adminOnlyItem = { href: '/admin-users', label: 'Admins', Icon: UserCog };

  const isAdmin = $derived(hasPermission(role as AdminRole, 'SUPER_ADMIN'));

  const roleLabel = $derived(
    role === 'SUPER_ADMIN' ? 'Super Admin' :
    role === 'ADMIN'       ? 'Admin'       :
    role === 'OPERATOR'    ? 'Operador'    : 'Usuário'
  );

  const roleBadgeVariant = $derived(
    role === 'SUPER_ADMIN' ? 'magenta' :
    role === 'ADMIN'       ? 'cyan'    : 'muted'
  );
</script>

<div class="layout-root">
  <aside class="sidebar">
    <!-- Ambient glow top-left -->
    <div class="sidebar-glow" aria-hidden="true"></div>

    <!-- Logo -->
    <div class="logo-area">
      <img src="/Prisma_Pay_White.svg" alt="PRISMA Pay" class="logo-img" />
      <div class="logo-accent" aria-hidden="true"></div>
    </div>

    <!-- Navigation -->
    <nav class="nav">
      <span class="nav-group-label">Principal</span>
      {#each mainNavItems as item}
        {@const isActive = $page.url.pathname.startsWith(item.href)}
        <a href={item.href} class="nav-item" class:active={isActive}>
          <span class="nav-icon"><svelte:component this={item.Icon} size={15} strokeWidth={1.5} /></span>
          <span class="nav-label">{item.label}</span>
          {#if isActive}<span class="active-dot" aria-hidden="true"></span>{/if}
        </a>
      {/each}

      <span class="nav-group-label" style="margin-top: 10px;">Configurações</span>
      {#each configNavItems as item}
        {@const isActive = $page.url.pathname.startsWith(item.href)}
        <a href={item.href} class="nav-item" class:active={isActive}>
          <span class="nav-icon"><svelte:component this={item.Icon} size={15} strokeWidth={1.5} /></span>
          <span class="nav-label">{item.label}</span>
          {#if isActive}<span class="active-dot" aria-hidden="true"></span>{/if}
        </a>
      {/each}

      {#if isAdmin}
        <span class="nav-group-label" style="margin-top: 10px;">Sistema</span>
        <a
          href={adminOnlyItem.href}
          class="nav-item"
          class:active={$page.url.pathname.startsWith(adminOnlyItem.href)}
        >
          <span class="nav-icon"><svelte:component this={adminOnlyItem.Icon} size={15} strokeWidth={1.5} /></span>
          <span class="nav-label">{adminOnlyItem.label}</span>
          {#if $page.url.pathname.startsWith(adminOnlyItem.href)}
            <span class="active-dot" aria-hidden="true"></span>
          {/if}
        </a>
      {/if}
    </nav>

    <!-- Footer: user context + logout -->
    <div class="footer">
      <div class="user-row">
        <div class="avatar">
          <UserCog size={13} strokeWidth={1.5} />
        </div>
        <div class="user-meta">
          <span class="user-title">Administrador</span>
          <span class="role-badge role-badge--{roleBadgeVariant}">{roleLabel}</span>
        </div>
      </div>

      <form method="POST" action="/logout" use:enhance>
        <button type="submit" class="logout-btn">
          <LogOut size={15} strokeWidth={1.5} />
          Sair da conta
        </button>
      </form>
    </div>
  </aside>

  <main class="main-content">
    {@render content()}
  </main>
</div>

<style>
  /* ── Root layout ──────────────────────────────────────────── */
  .layout-root {
    display: flex;
    min-height: 100svh;
  }

  /* ── Sidebar shell ────────────────────────────────────────── */
  .sidebar {
    position: relative;
    width: 256px;
    min-width: 256px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--color-background-subtle, #0A0A0F);
    border-right: 1px solid var(--color-border, rgba(255,255,255,0.08));
    overflow: hidden;
  }

  /* Radial ambient glow — top-left corner */
  .sidebar-glow {
    position: absolute;
    top: -60px;
    left: -60px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,0,255,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Logo ─────────────────────────────────────────────────── */
  .logo-area {
    position: relative;
    z-index: 1;
    padding: 22px 20px 18px;
    border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
  }

  .logo-img {
    height: 28px;
    width: auto;
    display: block;
  }

  /* Gradient accent line replacing the border */
  .logo-accent {
    position: absolute;
    bottom: -1px;
    left: 20px;
    right: 20px;
    height: 1px;
    background: linear-gradient(
      90deg,
      var(--color-brand-magenta) 0%,
      var(--color-brand-cyan) 55%,
      transparent 100%
    );
    opacity: 0.55;
  }

  /* ── Navigation ───────────────────────────────────────────── */
  .nav {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }

  .nav-group-label {
    display: block;
    padding: 6px 12px 3px;
    font-size: 0.6rem;
    font-family: var(--font-mono, monospace);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-foreground-disabled, #3A3A50);
    user-select: none;
  }

  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 12px 8px 10px;
    border-radius: 10px;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--color-foreground-secondary, #9090A8);
    background: transparent;
    border-left: 2px solid transparent;
    text-decoration: none;
    min-height: 40px;
    transition: background 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s;
  }

  .nav-item:hover {
    background: var(--color-surface, #0F0F18);
    color: var(--color-foreground, #F6F6FF);
    border-left-color: var(--color-border-hover, rgba(255,255,255,0.14));
  }

  .nav-item:hover .nav-icon {
    color: var(--color-brand-cyan, #01FAFB);
    transform: scale(1.12);
  }

  .nav-item.active {
    background: var(--color-surface-elevated, #141420);
    color: var(--color-foreground, #F6F6FF);
    font-weight: 600;
    border-left-color: var(--color-brand-magenta, #FF00FF);
    box-shadow:
      inset 3px 0 16px rgba(255, 0, 255, 0.07),
      0 0 0 0 transparent;
  }

  .nav-item.active .nav-icon {
    color: var(--color-brand-magenta, #FF00FF);
  }

  .nav-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: inherit;
    transition: color 0.18s, transform 0.18s;
  }

  .nav-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Active indicator dot — right side */
  .active-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-brand-magenta, #FF00FF);
    box-shadow: 0 0 6px rgba(255, 0, 255, 0.7);
    flex-shrink: 0;
    margin-left: auto;
  }

  /* ── Footer ───────────────────────────────────────────────── */
  .footer {
    position: relative;
    z-index: 1;
    padding: 12px 10px;
    border-top: 1px solid var(--color-border, rgba(255,255,255,0.08));
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    border-radius: 10px;
    background: var(--color-surface, #0F0F18);
    border: 1px solid var(--color-border, rgba(255,255,255,0.08));
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-surface-overlay, #1A1A28);
    border: 1px solid var(--color-border-hover, rgba(255,255,255,0.14));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-foreground-secondary, #9090A8);
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow: hidden;
    min-width: 0;
  }

  .user-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-foreground, #F6F6FF);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
  }

  /* Role badges */
  .role-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 0.575rem;
    font-family: var(--font-mono, monospace);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1.6;
    width: fit-content;
  }

  .role-badge--magenta {
    background: rgba(255, 0, 255, 0.12);
    color: var(--color-brand-magenta, #FF00FF);
    border: 1px solid rgba(255, 0, 255, 0.28);
  }

  .role-badge--cyan {
    background: rgba(1, 250, 251, 0.08);
    color: var(--color-brand-cyan, #01FAFB);
    border: 1px solid rgba(1, 250, 251, 0.22);
  }

  .role-badge--muted {
    background: rgba(144, 144, 168, 0.08);
    color: var(--color-foreground-secondary, #9090A8);
    border: 1px solid var(--color-border, rgba(255,255,255,0.08));
  }

  /* Logout button */
  .logout-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--color-foreground-secondary, #9090A8);
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    min-height: 38px;
    transition: background 0.18s, color 0.18s;
  }

  .logout-btn:hover {
    background: rgba(255, 59, 92, 0.08);
    color: var(--color-danger, #FF3B5C);
  }

  /* ── Main content ─────────────────────────────────────────── */
  .main-content {
    flex: 1;
    overflow: auto;
    background: var(--color-background, #070707);
  }
</style>
