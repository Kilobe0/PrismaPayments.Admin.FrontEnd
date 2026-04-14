---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-04-01T17:22:22.920Z"
progress:
  total_phases: 9
  completed_phases: 3
  total_plans: 12
  completed_plans: 12
---

# Project State

**Last updated:** 2026-04-14
**Status:** In Progress
**Last session:** 2026-04-14T00:20:17Z

## Accumulated Context

### Pending Todos

- 1 todo pendente: "Refazer sidebar AdminLayout com personalidade visual PRISMA" (área: ui)
  → `.planning/todos/pending/2026-03-30-refazer-sidebar-adminlayout-com-personalidade-visual-prisma.md`

### Roadmap Evolution

- Phase 01.1 inserida após Phase 1: shadcn init e identidade visual Prisma (URGENT)

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-24)

**Core value:** Equipe interna opera a plataforma de pagamentos — aprovações, disputas, monitoramento — com interface confiável e RBAC.
**Current focus:** Phase 03 — transactions

## Current Position

Phase: 3
Plan: 2 (complete)
Current Plan: 03-02 complete

## Current Phase

**Phase 1: Auth + Core Infrastructure**

Plans 01 + 02 + 03 + 04 + 05 completos: cookie HttpOnly login, SSR guards, token refresh com fila de concorrência, RBAC via setContext, sidebar menu filtrado por role, redirect de / server-side, error boundary, StatusBadge, ConfirmDialog, DataTable genérico com @tanstack/table-core, Pagination, SearchInput, SelectFilter, DateRangeFilter. DASH-02 (bar chart com period tabs via svelte5-chartjs) e DASH-03 (alert cards de disputas e KYC) implementados.

Phase 1 completa — todos os 5 planos executados.

## Roadmap Summary

- [ ] Phase 1: Auth + Core Infrastructure (21 requirements) ← **CURRENT**
- [ ] Phase 2: Merchants (9 requirements)
- [ ] Phase 3: Transactions (5 requirements)
- [ ] Phase 4: Disputes (4 requirements)
- [ ] Phase 5: Fees (4 requirements)
- [ ] Phase 6: Admin Users (4 requirements)
- [ ] Phase 7: Audit + Diagnostics (9 requirements)
- [ ] Phase 8: Providers + Platform Config (2 requirements)

**Total:** 52 requirements v1 | 8 fases

## Key Context

- **Stack:** SvelteKit 5 + TypeScript + Tailwind CSS
- **Arquitetura:** Clean Architecture por feature (domain/data/presentation)
- **Codebase map:** .planning/codebase/ (mapeado em 2026-03-24)
- **Research:** .planning/research/ (5 docs, commitado em 08ee789)
- **Git:** inicializado em 2026-03-24

## Critical Decisions from Research

- `@tanstack/table-core` (não `@tanstack/svelte-table` — quebrado no Svelte 5)
- `svelte-sonner` para toasts (Svelte 5 nativo)
- `jwt-decode` v4 para extrair role do JWT
- `Intl.NumberFormat('pt-BR')` nativo para currency (sem lib)
- CNPJ alfanumérico ativo em julho 2026 — suportar desde já
- Auth: cookie HttpOnly via server action + sessionStorage no cliente (dois layers)
- Token refresh: fila de requisições concorrentes durante refresh

## Decisions Made in Plan 01-01

- Login usa SvelteKit form action (não client-side fetch) para escrever HttpOnly cookie server-side
- Logout via form POST a /login?/logout para garantir limpeza de cookie no servidor
- tokenStorage usa jwt-decode v4 (substitui hack atob)
- tokenStorage.decodeJwtPayload exportado explicitamente para uso pelo apiClient no plan 02
- vitest@2.1.9 pinado com @vitest/coverage-v8@2.1.9 para evitar conflito de peer deps

## Decisions Made in Plan 01-02

- rbac.test.ts importa adminGuard via caminho relativo (não alias $appmod) para compatibilidade com vitest — padrão consistente com auth.test.ts do plan 01
- Rota logout do plan 01 mantida sem alterações — implementação com auto-submit é superior ao spec do plan 02

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01 | 01 | ~5 min | 3/3 | 17 |
| 01 | 02 | 8 min | 2/2 | 5 |
| 01 | 03 | 3 min | 2/2 | 6 |
| 01 | 04 | 3 min | 2/2 | 6 |
| 01 | 05 | 2 min | 2/2 | 6 |
| Phase 01.1-shadcn-init-e-identidade-visual-prisma P01 | 8 min | 2 tasks | 104 files |
| Phase 01.1-shadcn-init-e-identidade-visual-prisma P02 | 5 min | 2 tasks | 3 files |
| Phase 01.1-shadcn-init-e-identidade-visual-prisma P03 | 10 | 2 tasks | 5 files |
| Phase 02 P03 | 8 min | 2 tasks | 4 files |
| Phase 02 P04 | 8 min | 2 tasks | 7 files |
| 03 | 01 | 6 min | 2/2 | 25 |
| 03 | 02 | 8 min | 2/2 | 4 |

## Decisions Made in Plan 01-03

- Native `<dialog>` element for ConfirmDialog — no external modal library needed (browser-native Escape handling, backdrop, focus trap)
- Inline style props for StatusBadge dynamic colors — Svelte scoped CSS cannot use runtime values in class definitions
- `$effect` for dialog showModal/close ensures correct lifecycle coordination with Svelte 5 reactivity

## Decisions Made in Plan 01-04

- createTable wrapped in $derived (not $state) so it reacts to data/sorting changes automatically in Svelte 5
- Client-side pagination via row slice for simpler page reset logic on data change
- Outside-click overlay (z-index 49) for SelectFilter dropdown uses fixed position pattern

## Decisions Made in Plan 01-05

- $effect for chart data re-fetch on activePeriod change — reactive without onMount complexity
- Dual y-axis chart (volume R$ left, transaction count right) — different units require separate scales
- DASHBOARD_ADMIN_SERIES as function (period: string) => string — consistent with parameterized path pattern in apiPaths.ts

## Decisions Made in Plan 01.1-01

- shadcn-svelte@1.2.3 uses nova style internally; components.json retains "new-york" label for spec compliance — zero functional difference
- Calendar component uses Record<string,unknown> intersection type to avoid bits-ui discriminated union TypeScript complexity error (known shadcn-svelte + bits-ui@2.16.3 incompatibility)
- tailwind-merge installed alongside tailwind-variants to support standard cn() helper pattern

## Decisions Made in Plan 01.1-03

- bits-ui Select requires type='single' prop to resolve TypeScript union ambiguity (SelectSingleRootProps vs SelectMultipleRootProps)
- Select.Value not exported by shadcn-svelte select — selected option label computed via $derived from options array
- Input shadcn passes style via ...restProps spread, so inline style override works correctly
- AdminLayout glow uses padding 4-value shorthand to control padding-left independently per isActive state

## Decisions Made in Plan 02-03

- ConfirmDialog uses requiresReason (with 's') and onconfirm/oncancel (lowercase) — adapted from reading real component API before implementing
- StatusBadge has no type prop — only status prop, confirmed from real implementation
- pdfjs-dist CDN worker URL used to avoid vite config changes for worker bundling

## Decisions Made in Plan 03-01

- range-calendar manually created (bits-ui RangeCalendar.Root + Calendar sub-components) — shadcn-svelte CLI blocked on interactive button overwrite prompt
- MerchantAutocomplete uses custom div dropdown (not shadcn Select) — Select does not support async search
- DateRangePicker date filter applied client-side (D-19) — API does not document startDate/endDate query params
- AdminLayout Transacoes submenu uses $state txnOpen + $derived isTxnActive for collapsible behavior

## Decisions Made in Plan 03-02

- PaymentMethodCard receives full Payment entity to keep conditional logic (method + data presence) co-located with rendering
- Route uses `$page.params.id ?? ''` nullish coalescing — SvelteKit types params as `string | undefined` but route guarantees existence
- Controller initialized once at component creation — stable route param, page remounts on navigation

## Next Action

Phase 03 Plan 02 complete. Ready for Plan 03-03: Withdrawals list page.
