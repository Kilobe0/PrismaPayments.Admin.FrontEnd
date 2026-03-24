# Project State

**Last updated:** 2026-03-24
**Status:** Ready for Phase 1

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-24)

**Core value:** Equipe interna opera a plataforma de pagamentos — aprovações, disputas, monitoramento — com interface confiável e RBAC.
**Current focus:** Phase 1 — Auth + Core Infrastructure

## Current Phase

**Phase 1: Auth + Core Infrastructure**

Bloqueador crítico: cookie `access_token` nunca é escrito no login — toda navegação pós-login redireciona para `/login`. Este é o único item que importa na Phase 1.

Após o fix de auth: token refresh, RBAC guards, componentes compartilhados (DataTable, StatusBadge, ConfirmDialog, Toast, error boundary), formatação de moeda, melhoria do dashboard.

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

## Next Action

```
/gsd:plan-phase 1
```
