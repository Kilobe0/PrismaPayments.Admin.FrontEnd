# Roadmap: PrismaPayments Admin Frontend

## Overview

Este roadmap transforma os 52 requisitos v1 em 8 fases de entrega para o painel administrativo interno da Prisma Payments. A estrutura parte de um bloqueador critico -- o bug de autenticacao que impede qualquer navegacao autenticada -- e avanca em ordem de dependencia: infraestrutura compartilhada, depois features de maior valor de negocio (Merchants), depois features transacionais e operacionais, e por fim views read-only de menor complexidade. Cada fase entrega uma capacidade completa e verificavel, reutilizando os padroes estabelecidos pela fase anterior. A equipe interna (VIEWER/SUPPORT/ADMIN/SUPER_ADMIN) consegue operar a plataforma de pagamentos ao fim de cada fase, com controle de acesso por role aplicado desde a Fase 1.

## Phases

- [x] **Phase 1: Auth + Core Infrastructure** - Corrigir o bug critico de cookie, implementar refresh de token, ativar RBAC e construir todos os componentes compartilhados que as demais features dependem (completed 2026-03-25)
- [ ] **Phase 2: Merchants** - Entrega completa da feature de merchants: lista paginada, detalhe tabulado, review de KYC, acoes de status e criacao -- o template que todas as features seguintes copiam
- [ ] **Phase 3: Transactions** - Listas cross-merchant de pagamentos e saques com filtros completos e paginas de detalhe por metodo de pagamento
- [ ] **Phase 4: Disputes** - Lista de disputas com destaque para MED time-sensitive, timeline visual e formulario de resolucao para SUPPORT+
- [ ] **Phase 5: Fees** - CRUD de regras de taxas (globais e por merchant) com conversao basis-points/centavos e simulador inline
- [ ] **Phase 6: Admin Users** - Gestao de usuarios administrativos exclusiva para SUPER_ADMIN, completamente oculta para outros roles
- [ ] **Phase 7: Audit + Diagnostics** - Log cronologico de auditoria com diff visual e logs HTTP diagnosticos com filtros avancados e trace view
- [ ] **Phase 8: Providers + Platform Config** - Cards read-only de provedores de pagamento e snapshot read-only de configuracao da plataforma

## Phase Details

### Phase 1: Auth + Core Infrastructure
**Goal**: Qualquer admin autenticado consegue navegar pelo painel com o role correto aplicado, e todos os componentes compartilhados estao disponiveis para as features seguintes
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, RBAC-01, RBAC-02, RBAC-03, RBAC-04, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Admin faz login com email/senha e permanece logado ao navegar entre paginas -- o cookie HttpOnly e escrito e lido corretamente pelo SSR
  2. Token expirado e renovado automaticamente em background sem que o admin perceba interrupcao, mesmo com multiplas requisicoes concorrentes
  3. Admin sem role suficiente e bloqueado tanto no SSR (redirect 403) quanto no cliente ao tentar acessar rota protegida -- itens de menu e botoes de acao indisponiveis sao ocultados, nao desabilitados
  4. Dashboard exibe metricas globais (volume, transacoes, saldo, taxas, merchants), grafico por periodo e alertas de disputas abertas e KYC pendente
  5. DataTable, StatusBadge, ConfirmDialog, Toast e filtros reutilizaveis estao funcionando e podem ser consumidos por qualquer feature seguinte
**Plans**: TBD
**UI hint**: yes

### Phase 01.1: shadcn init e identidade visual Prisma (INSERTED)

**Goal:** Inicializar shadcn-svelte, instalar primitivas bits-ui como componentes prontos (Button, Badge, Input, Select, Dialog, Table, etc.) e migrar todos os widgets compartilhados para usar essas primitivas internamente, aplicando identidade visual Prisma (dark theme, magenta/cyan, glow na sidebar)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Depends on:** Phase 1
**Plans:** 3/3 plans complete

Plans:
- [x] 01.1-01-PLAN.md -- shadcn init + instalar 13 componentes + CSS vars Prisma em app.css
- [x] 01.1-02-PLAN.md -- migrar ConfirmDialog (Dialog bits-ui), StatusBadge (Badge shadcn), Pagination (Button shadcn)
- [x] 01.1-03-PLAN.md -- migrar DataTable (Table shadcn), filtros (Select/Input shadcn), AdminLayout glow

### Phase 2: Merchants
**Goal**: Time interno consegue visualizar, criar, gerenciar status e revisar KYC de merchants a partir de uma interface completa e tabulada
**Depends on**: Phase 1
**Requirements**: MERCH-01, MERCH-02, MERCH-03, MERCH-04, MERCH-05, MERCH-06, MERCH-07, MERCH-08, MERCH-09
**Success Criteria** (what must be TRUE):
  1. Admin (VIEWER+) visualiza lista paginada de merchants com filtros por status e verificacao, tabs de contagem rapida e entrada dedicada "Verificacoes Pendentes" na sidebar com badge de contagem
  2. Admin (VIEWER+) abre pagina de detalhe do merchant com abas Info / KYC / Saldo / Configuracoes / Transacoes / Credenciais navegaveis e populadas com dados reais
  3. Admin (SUPPORT+) aprova, suspende, bloqueia ou reativa um merchant via dialog de confirmacao com campo de motivo obrigatorio -- status reflete imediatamente na lista
  4. Admin (SUPPORT+) revisa documentos KYC (imagens e PDFs em preview inline via pdfjs-dist), aprova ou rejeita com campo de notas -- resultado persiste
  5. Admin (ADMIN+) cria um novo merchant via formulario completo e cria credencial de API exibindo o secretKey apenas uma vez
**Plans**: 4 planos criados
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md -- Foundation: Sheet install, apiPaths, domain, repository, service, controller, lista com tabs/filtros, sidebar badge
- [x] 02-02-PLAN.md -- Detail Page: controller hibrido, 6 abas (Info/Saldo/Config eager + KYC/Creds/Txns lazy)
- [x] 02-03-PLAN.md -- KYC Review + Status Actions: ConfirmDialog por status, pdfjs-dist preview inline
- [ ] 02-04-PLAN.md -- Credenciais + Criar Merchant: CredentialsTab, SecretKeyModal one-time, TransactionsTab, CreateMerchantSheet

### Phase 3: Transactions
**Goal**: Time interno visualiza todos os pagamentos e saques da plataforma, filtrados por merchant, status, metodo e periodo, com detalhe completo por transacao
**Depends on**: Phase 2
**Requirements**: TXN-01, TXN-02, TXN-03, TXN-04, TXN-05
**Success Criteria** (what must be TRUE):
  1. Admin (VIEWER+) visualiza lista paginada de pagamentos cross-merchant com filtros por merchant, status, metodo de pagamento e periodo -- coluna Merchant e link navegavel para o detalhe do merchant
  2. Admin (VIEWER+) abre detalhe de um pagamento e ve as informacoes corretas para o metodo: QR code PIX, codigo de barras Boleto ou ultimos 4 digitos do cartao -- valores exibidos em R$ formatado (Intl.NumberFormat pt-BR)
  3. Admin (VIEWER+) visualiza lista paginada de saques cross-merchant com filtros por merchant e status, e abre detalhe com chave PIX do recipient e valores bruto/taxa/liquido
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Foundation: shadcn install, domain entities, shared components (Breadcrumbs, DateRangePicker, MerchantAutocomplete), StatusBadge extension, sidebar submenu, payments list page
- [ ] 03-02-PLAN.md -- Payment detail: stacked cards, conditional method rendering (PIX/Boleto/Card), breadcrumbs
- [ ] 03-03-PLAN.md -- Withdrawals: repository+service+controller, list page, detail page, cross-nav "Ver todas" link
**UI hint**: yes

### Phase 4: Disputes
**Goal**: Time de suporte consegue acompanhar, priorizar e resolver disputas, com destaque visual para MEDs time-sensitive
**Depends on**: Phase 2
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04
**Success Criteria** (what must be TRUE):
  1. Admin (VIEWER+) visualiza lista paginada de disputas com filtros por status e tipo -- disputas do tipo MED sao destacadas visualmente como time-sensitive e destacam-se das demais
  2. Admin (VIEWER+) abre detalhe de uma disputa e ve a timeline visual completa dos estados (abertura -> analise -> resolucao)
  3. Admin (SUPPORT+) preenche o formulario de resolucao com status e texto de resolucao -- ambos os campos sao obrigatorios antes do botao de submit ser habilitado -- resolucao persiste e status atualiza na lista
**Plans**: TBD
**UI hint**: yes

### Phase 5: Fees
**Goal**: Admins conseguem visualizar, criar, editar e excluir regras de taxas globais e por merchant, e simular o resultado liquido de qualquer operacao
**Depends on**: Phase 1
**Requirements**: FEES-01, FEES-02, FEES-03, FEES-04
**Success Criteria** (what must be TRUE):
  1. Admin (VIEWER+) visualiza a pagina de taxas com duas secoes distintas: regras globais (sem merchantId) e regras por merchant
  2. Admin (ADMIN+) cria ou edita uma regra de taxa com tipo, calculo percentual (basis points <-> %) ou fixo (centavos <-> R$) e limites minimo/maximo opcionais -- valores sao convertidos e exibidos corretamente
  3. Admin (ADMIN+) exclui uma regra via dialog de confirmacao -- regra removida nao aparece mais na lista
  4. Admin preenche o simulador com tipo, valor e merchant opcional e ve o resultado exibindo bruto, taxa aplicada e valor liquido com a regra que foi utilizada
**Plans**: TBD
**UI hint**: yes

### Phase 6: Admin Users
**Goal**: SUPER_ADMIN consegue gerenciar o ciclo de vida completo de usuarios administrativos; a feature e completamente invisivel para todos os outros roles
**Depends on**: Phase 1
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):
  1. Qualquer admin com role abaixo de SUPER_ADMIN nao ve a entrada "Admin Users" na sidebar nem consegue acessar a rota diretamente -- recebe 403, nao redirect para login
  2. SUPER_ADMIN visualiza lista paginada de admins com nome, email, role e status ativo/inativo
  3. SUPER_ADMIN cria um novo admin com nome, email, senha e role via formulario -- novo admin aparece na lista
  4. SUPER_ADMIN altera o role ou ativa/desativa um admin existente -- botao de desativacao e desabilitado para o proprio usuario logado
**Plans**: TBD
**UI hint**: yes

### Phase 7: Audit + Diagnostics
**Goal**: Admins e SUPER_ADMINs conseguem rastrear qualquer acao realizada no sistema e investigar anomalias via logs HTTP completos com trace view
**Depends on**: Phase 2
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, DIAG-01, DIAG-02, DIAG-03, DIAG-04, DIAG-05, DIAG-06
**Success Criteria** (what must be TRUE):
  1. Admin (ADMIN+) visualiza log cronologico reverso de auditoria com filtros por ator, tipo de acao, tipo de recurso e periodo -- IDs de recursos sao links navegaveis para a entidade afetada (merchant, pagamento, etc.)
  2. Admin (ADMIN+) expande uma entrada do log de auditoria e ve diff visual before/after com campos alterados destacados -- nao JSON bruto
  3. Admin (ADMIN+) visualiza lista paginada de logs HTTP com filtros avancados (periodo, level, status code, metodo, path, traceId, merchantId, hasError) -- linhas coloridas por faixa de status (2xx verde, 4xx amarelo, 5xx vermelho)
  4. Admin (ADMIN+) abre detalhe de um log HTTP e ve request/response formatados como JSON, headers, duracao e stack trace de erro quando presente; consegue agrupar todos os logs com o mesmo traceId via trace view ou busca rapida por traceId
  5. SUPER_ADMIN executa purge de logs via acao com dialog de confirmacao -- logs removidos nao aparecem mais na lista
**Plans**: TBD
**UI hint**: yes

### Phase 8: Providers + Platform Config
**Goal**: Qualquer admin autenticado consegue consultar o status dos provedores de pagamento e o snapshot de configuracao da plataforma sem acoes de escrita
**Depends on**: Phase 1
**Requirements**: PROV-01, CONFIG-01
**Success Criteria** (what must be TRUE):
  1. Admin (VIEWER+) visualiza cards read-only por provedor de pagamento exibindo nome, tipo (PAYMENT/BANKING), metodos suportados e status ativo/inativo
  2. Admin (ADMIN+) acessa a pagina de configuracao da plataforma e ve um snapshot read-only dos valores de configuracao -- sem campos editaveis; admin com role abaixo de ADMIN nao acessa a rota
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth + Core Infrastructure | 5/5 | Complete   | 2026-03-25 |
| 01.1. shadcn init + identidade visual | 3/3 | Complete    | 2026-03-25 |
| 2. Merchants | 3/4 | In Progress|  |
| 3. Transactions | 0/3 | Not started | - |
| 4. Disputes | 0/0 | Not started | - |
| 5. Fees | 0/0 | Not started | - |
| 6. Admin Users | 0/0 | Not started | - |
| 7. Audit + Diagnostics | 0/0 | Not started | - |
| 8. Providers + Platform Config | 0/0 | Not started | - |

---

## Coverage

**v1 Requirements: 52 total -- 52 mapped -- 0 orphans**

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete (01-01) |
| AUTH-02 | Phase 1 | Complete (01-01) |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Complete (01-01) |
| AUTH-05 | Phase 1 | Complete (01-01) |
| AUTH-06 | Phase 1 | Complete (01-01) |
| RBAC-01 | Phase 1 | Pending |
| RBAC-02 | Phase 1 | Pending |
| RBAC-03 | Phase 1 | Pending |
| RBAC-04 | Phase 1 | Pending |
| INFRA-01 | Phase 01.1 | Pending |
| INFRA-02 | Phase 01.1 | Pending |
| INFRA-03 | Phase 01.1 | Pending |
| INFRA-04 | Phase 01.1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Pending |
| INFRA-07 | Phase 1 | Pending |
| INFRA-08 | Phase 1 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 1 | Pending |
| DASH-03 | Phase 1 | Pending |
| MERCH-01 | Phase 2 | Pending |
| MERCH-02 | Phase 2 | Pending |
| MERCH-03 | Phase 2 | Pending |
| MERCH-04 | Phase 2 | Pending |
| MERCH-05 | Phase 2 | Pending |
| MERCH-06 | Phase 2 | Pending |
| MERCH-07 | Phase 2 | Pending |
| MERCH-08 | Phase 2 | Pending |
| MERCH-09 | Phase 2 | Pending |
| TXN-01 | Phase 3 | Pending |
| TXN-02 | Phase 3 | Pending |
| TXN-03 | Phase 3 | Pending |
| TXN-04 | Phase 3 | Pending |
| TXN-05 | Phase 3 | Pending |
| DISP-01 | Phase 4 | Pending |
| DISP-02 | Phase 4 | Pending |
| DISP-03 | Phase 4 | Pending |
| DISP-04 | Phase 4 | Pending |
| FEES-01 | Phase 5 | Pending |
| FEES-02 | Phase 5 | Pending |
| FEES-03 | Phase 5 | Pending |
| FEES-04 | Phase 5 | Pending |
| ADMIN-01 | Phase 6 | Pending |
| ADMIN-02 | Phase 6 | Pending |
| ADMIN-03 | Phase 6 | Pending |
| ADMIN-04 | Phase 6 | Pending |
| AUDIT-01 | Phase 7 | Pending |
| AUDIT-02 | Phase 7 | Pending |
| AUDIT-03 | Phase 7 | Pending |
| DIAG-01 | Phase 7 | Pending |
| DIAG-02 | Phase 7 | Pending |
| DIAG-03 | Phase 7 | Pending |
| DIAG-04 | Phase 7 | Pending |
| DIAG-05 | Phase 7 | Pending |
| DIAG-06 | Phase 7 | Pending |
| PROV-01 | Phase 8 | Pending |
| CONFIG-01 | Phase 8 | Pending |

---

*Roadmap created: 2026-03-24*
*Granularity: standard (8 phases derived from 52 v1 requirements across 10 feature domains)*
