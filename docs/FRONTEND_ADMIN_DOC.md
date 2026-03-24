# Frontend Admin (Painel Administrativo) — Documentação de Implementação

> Documentação completa para implementar o painel administrativo do Prisma Payments.
> Stack de referência: **SvelteKit** — mas siga a arquitetura agnóstica descrita em `murillo's-architecture-frontend.md`.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura e Estrutura de Pastas](#2-arquitetura-e-estrutura-de-pastas)
3. [Infraestrutura Core](#3-infraestrutura-core)
4. [Autenticação e Roles](#4-autenticação-e-roles)
5. [Features](#5-features)
   - 5.1 [Dashboard Admin](#51-dashboard-admin)
   - 5.2 [Gestão de Merchants](#52-gestão-de-merchants)
   - 5.3 [Verificação / KYC Review](#53-verificação--kyc-review)
   - 5.4 [Transações (Pagamentos e Saques)](#54-transações)
   - 5.5 [Disputas (Chargebacks)](#55-disputas)
   - 5.6 [Regras de Taxas (Fees)](#56-regras-de-taxas)
   - 5.7 [Gestão de Admins](#57-gestão-de-admins)
   - 5.8 [Auditoria (Audit Log)](#58-auditoria)
   - 5.9 [Provedores (Providers)](#59-provedores)
   - 5.10 [Diagnósticos (Logs HTTP)](#510-diagnósticos)
   - 5.11 [Configuração da Plataforma](#511-configuração-da-plataforma)
6. [Contrato de API (RouteMessages)](#6-contrato-de-api-routemessages)
7. [Enums e Constantes](#7-enums-e-constantes)
8. [Controle de Acesso por Role](#8-controle-de-acesso-por-role)
9. [Guia de Navegação e Rotas](#9-guia-de-navegação-e-rotas)

---

## 1. Visão Geral

O **Frontend Admin** é o painel usado pela equipe interna para:
- Monitorar métricas globais da plataforma
- Gerenciar merchants (aprovação, suspensão, verificação KYC)
- Visualizar todas as transações cross-merchant
- Resolver disputas e chargebacks
- Configurar regras de taxas (globais e por merchant)
- Gerenciar usuários administrativos
- Consultar audit log
- Monitorar provedores de pagamento
- Acessar diagnósticos e logs HTTP

**Base URL da API**: `{API_BASE_URL}/api/v1`
**Autenticação**: JWT Bearer Token via header `Authorization: Bearer {accessToken}`
**Perfil**: Admin (diferente do merchant — login por endpoint separado)

---

## 2. Arquitetura e Estrutura de Pastas

```
src/
├── entry_point
├── app/
│   ├── app_widget
│   ├── router
│   │
│   ├── features/
│   │   ├── auth/                        # Login admin
│   │   ├── dashboard/                   # Métricas globais da plataforma
│   │   ├── merchants/
│   │   │   ├── management/              # CRUD de merchants
│   │   │   ├── verification/            # Review de KYC
│   │   │   └── credentials/             # Credenciais de API (criação por admin)
│   │   ├── transactions/
│   │   │   ├── payments/                # Pagamentos cross-merchant
│   │   │   └── withdrawals/             # Saques cross-merchant
│   │   ├── disputes/                    # Gestão de chargebacks
│   │   ├── fees/                        # Regras de taxas (CRUD)
│   │   ├── admin_users/                 # Gestão de usuários admin
│   │   ├── audit/                       # Audit log viewer
│   │   ├── providers/                   # Provedores de pagamento
│   │   ├── diagnostics/                 # Logs HTTP e debugging
│   │   └── config/                      # Configuração da plataforma
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── api_client
│   │   │   ├── api_response
│   │   │   └── api_interceptors
│   │   └── storage/
│   │       ├── local_storage
│   │       └── secure_storage
│   │
│   └── shared/
│       ├── widgets/                     # Componentes de UI reutilizáveis
│       ├── entities/                    # Entidades compartilhadas
│       ├── enums/
│       ├── messages/                    # RouteMessages parser
│       ├── guards/                      # Auth guard, role guard
│       ├── theme/
│       └── utils/                       # Formatters (dinheiro, datas, documentos)
│
└── core/
    ├── config/
    ├── constants/
    ├── error/
    ├── network/
    ├── service_locator/
    └── extensions/
```

---

## 3. Infraestrutura Core

### 3.1 API Client

```
Base URL: configurável via env
Headers padrão:
  - Content-Type: application/json
  - Authorization: Bearer {accessToken}

Interceptors:
  1. Auth Interceptor     → injeta Bearer token
  2. Error Interceptor    → parseia RouteMessages, trata 401 (→ logout), 403 (→ acesso negado)
  3. Retry Interceptor    → retry em falhas de rede
```

### 3.2 API Paths (Constantes)

```
AUTH_ADMIN_LOGIN       = /api/v1/auth/admin/login
AUTH_REFRESH           = /api/v1/auth/merchants/refresh   // Mesmo endpoint de refresh

ADMIN_USERS            = /api/v1/admin/users
ADMIN_MERCHANTS        = /api/v1/admin/merchants
ADMIN_PAYMENTS         = /api/v1/admin/payments
ADMIN_WITHDRAWALS      = /api/v1/admin/withdrawals
ADMIN_DISPUTES         = /api/v1/admin/disputes
ADMIN_AUDIT            = /api/v1/admin/audit
ADMIN_PROVIDERS        = /api/v1/admin/providers
ADMIN_CONFIG           = /api/v1/admin/config

FEES_RULES             = /api/v1/fees/rules
FEES_SIMULATE          = /api/v1/fees/simulate
FEES_MERCHANT_RULES    = /api/v1/fees/merchants

DIAGNOSTICS_LOGS       = /api/v1/diagnostics/logs
DIAGNOSTICS_STATS      = /api/v1/diagnostics/logs/stats

DASHBOARD_ADMIN        = /api/v1/dashboard/admin
```

### 3.3 ApiResponse (mesmo do Seller)

```typescript
interface ApiResponse<T> {
  responseType: "OK" | "CREATED" | "NO_CONTENT" | "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR"
  message: string
  title: string
  status: number
  data: T | null
  extendedResultCode: string
  date: string
}
```

---

## 4. Autenticação e Roles

### 4.1 Login Admin

```
POST /api/v1/auth/admin/login
```

**Request:**
```typescript
{
  email: string
  password: string
}
```

**Response (200):**
```typescript
{
  data: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}
```

**Fluxo pós-login:**
1. Salvar tokens em secure storage
2. Decodificar JWT para extrair `role` (SUPER_ADMIN, ADMIN, SUPPORT, VIEWER)
3. Redirecionar para `/dashboard`
4. Aplicar restrições de UI baseadas no role

### 4.2 Roles do Admin

| Role | Nível | Descrição |
|------|-------|-----------|
| `SUPER_ADMIN` | 4 (máximo) | Acesso total — gestão de admins, configurações de plataforma |
| `ADMIN` | 3 | Acesso a quase tudo, exceto gestão de admins |
| `SUPPORT` | 2 | Pode alterar status de merchants, resolver disputas |
| `VIEWER` | 1 (mínimo) | Apenas visualização — sem ações de escrita |

**O JWT contém o role.** Decodificar o token (sem verificar assinatura, pois o backend faz isso) para determinar o role e exibir/ocultar ações na UI.

### 4.3 Refresh e Logout

Mesmo mecanismo do Seller — refresh automático via interceptor, logout limpa tokens.

---

## 5. Features

### 5.1 Dashboard Admin

```
GET /api/v1/dashboard/admin
```

**Auth:** Bearer Token (Admin).

**Response:**
```typescript
{
  data: {
    totalVolume: number              // Volume total processado (centavos)
    totalTransactions: number        // Total de transações
    todayVolume: number              // Volume do dia (centavos)
    todayTransactions: number        // Transações do dia
    availableBalance: number         // Soma dos saldos disponíveis (centavos) — plataforma
    pendingBalance: number           // Soma dos saldos pendentes
    totalFeesCollected: number       // Total de taxas coletadas (centavos)
    totalMerchants: number           // Total de merchants cadastrados
  }
}
```

**UI sugerida:**
- Cards com métricas globais (volume, transações, taxas, merchants)
- Gráfico de volume e transações por dia/semana/mês
- Lista de merchants recentes que precisam de aprovação
- Alertas: disputas abertas, verificações pendentes
- Top merchants por volume

---

### 5.2 Gestão de Merchants

#### 5.2.1 Listar Merchants

```
GET /api/v1/admin/merchants
```

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `status` | string? | PENDING, ACTIVE, SUSPENDED, BLOCKED |
| `verification` | string? | UNVERIFIED, PENDING_REVIEW, VERIFIED, REJECTED |
| `skip` | int | Offset |
| `limit` | int | Itens por página |

**Response:**
```typescript
{
  data: {
    items: MerchantAdminResponse[]
    total: number
    skip: number
    limit: number
  }
}
```

**MerchantAdminResponse:**
```typescript
{
  id: string
  legalName: string
  tradeName: string
  documentNumber: string
  documentType: "CPF" | "CNPJ"
  email: string
  phone: string
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED"
  verificationStatus: "UNVERIFIED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED"
  createdAt: string
  updatedAt: string
}
```

#### 5.2.2 Detalhe do Merchant

```
GET /api/v1/admin/merchants/{id}
```

**Response:** `MerchantAdminResponse` com dados adicionais de saldo.

#### 5.2.3 Criar Merchant (pelo Admin)

```
POST /api/v1/admin/merchants
```

**Role mínimo:** ADMIN

**Request:**
```typescript
{
  legalName: string
  tradeName: string
  documentNumber: string
  documentType: "CPF" | "CNPJ"
  email: string
  phone: string
  password: string
  status: string | null                  // Pode já criar como ACTIVE
  verificationStatus: string | null      // Pode já criar como VERIFIED
}
```

#### 5.2.4 Alterar Status do Merchant

```
PUT /api/v1/admin/merchants/{id}/status
```

**Role mínimo:** SUPPORT

**Request:**
```typescript
{
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED"
  reason: string | null          // Motivo da alteração (vai para audit log)
}
```

**Transições válidas:**
- `PENDING` → `ACTIVE` (aprovação)
- `ACTIVE` → `SUSPENDED` (suspensão temporária)
- `SUSPENDED` → `ACTIVE` (reativação)
- `ACTIVE` → `BLOCKED` (bloqueio)
- `BLOCKED` → `ACTIVE` (desbloqueio — requer ADMIN+)

**UI:** dialog de confirmação com campo de motivo obrigatório.

#### 5.2.5 Review de Verificação KYC

```
PUT /api/v1/admin/merchants/{id}/verification
```

**Role mínimo:** SUPPORT

**Request:**
```typescript
{
  verificationStatus: "VERIFIED" | "REJECTED"
  notes: string | null           // Notas do reviewer
}
```

**UI:** na página de detalhe do merchant, exibir todos os documentos enviados (com preview/download), e botões "Aprovar" / "Rejeitar" com campo de notas.

#### 5.2.6 Atualizar Settings do Merchant (Admin)

```
PUT /api/v1/admin/merchants/{id}/settings
```

**Role mínimo:** ADMIN

**Request:**
```typescript
{
  webhookUrl: string | null
  twoFactorEnabled: boolean | null
  dailyWithdrawalLimit: number | null        // Centavos
  autoWithdrawalEnabled: boolean | null
  autoWithdrawalThreshold: number | null     // Centavos
}
```

#### 5.2.7 Criar Credencial para Merchant (Admin)

```
POST /api/v1/admin/merchants/{id}/credentials
```

**Role mínimo:** ADMIN

**Request:**
```typescript
{
  label: string
  environment: "LIVE" | "TEST"
}
```

**Response:** inclui `secretKey` — mostrar apenas uma vez (mesma regra do Seller).

#### 5.2.8 UI Sugerida — Gestão de Merchants

- **Lista:** tabela com (nome, documento, email, status, verificação, data de cadastro)
- **Filtros rápidos:** badges/tabs por status (Pendente, Ativo, Suspenso, Bloqueado)
- **Detalhe:** página completa com:
  - Informações do merchant
  - Status atual + botões de ação (Aprovar, Suspender, Bloquear)
  - Verificação KYC + documentos com preview
  - Saldo do merchant
  - Configurações editáveis
  - Últimas transações (pagamentos e saques)
  - Credenciais de API

---

### 5.3 Verificação / KYC Review

Integrado na gestão de merchants (ver seção 5.2.5).

**Fluxo dedicado:**
- Na sidebar, item "Verificações Pendentes" que filtra por `verification=PENDING_REVIEW`
- Tabela com merchants aguardando revisão
- Click abre detalhe com documentos e botões de ação

---

### 5.4 Transações

#### 5.4.1 Pagamentos Cross-Merchant

```
GET /api/v1/admin/payments
```

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `merchantId` | string? | Filtrar por merchant |
| `status` | string? | Status do pagamento |
| `method` | string? | Método de pagamento |
| `skip` | int | Offset |
| `limit` | int | Itens por página |

**Response:**
```typescript
{
  data: {
    items: PaymentResponse[]     // Mesmo DTO do Seller, mas cross-merchant
    total: number
    skip: number
    limit: number
  }
}
```

**PaymentResponse (completo):**
```typescript
{
  id: string
  merchantId: string                 // ← visível para admin (diferente do Seller)
  method: "PIX" | "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD"
  status: "CREATED" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | "EXPIRED"
  amount: number
  feeAmount: number
  netAmount: number
  currency: string
  description: string | null
  isTest: boolean

  pix: {
    qrCode: string
    qrCodeUrl: string | null
  } | null

  boleto: {
    barcode: string
    boletoUrl: string | null
    dueDate: string
  } | null

  card: {
    lastFourDigits: string
    brand: string
    installments: number
  } | null

  payer: {
    name: string
    maskedDocument: string
    email: string | null
    phone: string | null
  } | null

  expiresAt: string | null
  paidAt: string | null
  failedAt: string | null
  failureReason: string | null
  metadata: Record<string, string> | null
  createdAt: string
  updatedAt: string
}
```

#### 5.4.2 Saques Cross-Merchant

```
GET /api/v1/admin/withdrawals
```

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `merchantId` | string? | Filtrar por merchant |
| `status` | string? | Status do saque |
| `skip` | int | Offset |
| `limit` | int | Itens por página |

**Response:**
```typescript
{
  data: {
    items: WithdrawalResponse[]
    total: number
    skip: number
    limit: number
  }
}
```

**WithdrawalResponse:**
```typescript
{
  id: string
  merchantId: string
  externalId: string | null
  providerName: string | null
  status: "REQUESTED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
  amount: number
  feeAmount: number
  netAmount: number
  currency: string
  recipient: {
    pixKey: string
    pixKeyType: string
    name: string
    documentNumber: string
  }
  completedAt: string | null
  failedAt: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}
```

**UI sugerida:**
- Duas tabs ou páginas separadas: Pagamentos e Saques
- Coluna extra "Merchant" em ambas as tabelas (link para detalhe do merchant)
- Filtros: merchant (dropdown/busca), status, método, período
- Exportação (se implementado)

---

### 5.5 Disputas

#### 5.5.1 Listar Disputas

```
GET /api/v1/admin/disputes
```

**Response:**
```typescript
{
  data: [
    {
      id: string
      paymentId: string
      merchantId: string
      disputeType: "MED" | "CHARGEBACK" | "REFUND_REQUEST"
      status: "OPEN" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "RESOLVED"
      amount: number                 // Centavos
      reason: string | null
      resolution: string | null
      externalId: string | null
      openedAt: string
      resolvedAt: string | null
      createdAt: string
      updatedAt: string
    }
  ]
}
```

#### 5.5.2 Resolver Disputa

```
PUT /api/v1/admin/disputes/{id}
```

**Role mínimo:** SUPPORT

**Request:**
```typescript
{
  resolution: string             // Texto da resolução
  status: "ACCEPTED" | "REJECTED" | "RESOLVED"
}
```

**UI sugerida:**
- Tabela com (ID, merchant, tipo, valor, status, data abertura)
- Filtro por status (Aberta, Em análise, Resolvida)
- Detalhe: informações do pagamento relacionado + dados da disputa
- Formulário de resolução: dropdown de status + textarea para resolução
- Timeline visual: abertura → análise → resolução

---

### 5.6 Regras de Taxas

#### 5.6.1 Listar Regras

```
GET /api/v1/fees/rules?page={page}&pageSize={pageSize}
```

**Response:**
```typescript
{
  data: {
    items: FeeRuleResponse[]
    total: number
    page: number
    pageSize: number
  }
}
```

**FeeRuleResponse:**
```typescript
{
  id: string
  merchantId: string | null          // null = regra global (default)
  feeType: "PIX" | "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "WITHDRAWAL" | "ANTICIPATION"
  calculation: "PERCENTAGE" | "FIXED" | "PERCENTAGE_PLUS_FIXED"
  percentageRate: number             // Basis points (250 = 2.5%)
  fixedAmount: number                // Centavos
  minFee: number | null              // Taxa mínima (centavos)
  maxFee: number | null              // Taxa máxima (centavos)
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

#### 5.6.2 Criar Regra

```
POST /api/v1/fees/rules
```

**Request:**
```typescript
{
  merchantId: string | null          // null = regra global
  feeType: "PIX" | "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "WITHDRAWAL" | "ANTICIPATION"
  calculation: "PERCENTAGE" | "FIXED" | "PERCENTAGE_PLUS_FIXED"
  percentageRate: number             // Basis points (ex: 250 = 2.5%)
  fixedAmount: number                // Centavos
  minFee: number | null
  maxFee: number | null
}
```

#### 5.6.3 Atualizar Regra

```
PUT /api/v1/fees/rules/{id}
```

**Request (todos opcionais):**
```typescript
{
  feeType: string | null
  calculation: string | null
  percentageRate: number | null
  fixedAmount: number | null
  minFee: number | null
  maxFee: number | null
  isActive: boolean | null
}
```

#### 5.6.4 Excluir Regra

```
DELETE /api/v1/fees/rules/{id}
```

#### 5.6.5 Regras de um Merchant Específico

```
GET /api/v1/fees/merchants/{merchantId}/rules
```

Retorna lista de `FeeRuleResponse` ativas para aquele merchant (incluindo globais e específicas).

#### 5.6.6 Simular Taxa

```
POST /api/v1/fees/simulate
```

**Request:**
```typescript
{
  feeType: "PIX" | "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD" | "WITHDRAWAL" | "ANTICIPATION"
  amount: number                     // Valor bruto em centavos
  merchantId: string | null          // null = usar regra global
}
```

**Response:**
```typescript
{
  data: {
    grossAmount: number              // Valor bruto (centavos)
    feeAmount: number                // Valor da taxa (centavos)
    netAmount: number                // Valor líquido (centavos)
    ruleId: string | null            // ID da regra aplicada
    calculationType: string | null   // Tipo de cálculo usado
  }
}
```

**UI sugerida:**
- **Regras globais:** tabela separada para regras onde `merchantId == null`
- **Regras por merchant:** tabela filtrável por merchant
- **Formulário de criação/edição:**
  - Dropdown: tipo de taxa
  - Dropdown: tipo de cálculo
  - Input: percentual (exibir como %, armazenar como basis points → `2.5%` = `250`)
  - Input: valor fixo (exibir como R$, armazenar em centavos)
  - Inputs opcionais: taxa mínima e máxima
- **Simulador:** formulário lateral para testar taxas em tempo real
- **Formatação de basis points:** `percentageRate / 100` para exibir como percentual. Ex: `250` → `2,50%`

---

### 5.7 Gestão de Admins

#### 5.7.1 Criar Admin

```
POST /api/v1/admin/users
```

**Role mínimo:** SUPER_ADMIN

**Request:**
```typescript
{
  name: string
  email: string
  password: string
  role: "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "VIEWER"
}
```

#### 5.7.2 Listar Admins

```
GET /api/v1/admin/users
```

**Role mínimo:** SUPER_ADMIN

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `skip` | int | Offset |
| `limit` | int | Itens por página |

**Response:**
```typescript
{
  data: {
    items: [
      {
        id: string
        name: string
        email: string
        role: "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "VIEWER"
        isActive: boolean
        createdAt: string
        updatedAt: string
      }
    ]
    total: number
    skip: number
    limit: number
  }
}
```

#### 5.7.3 Obter Admin

```
GET /api/v1/admin/users/{id}
```

#### 5.7.4 Atualizar Admin

```
PUT /api/v1/admin/users/{id}
```

**Role mínimo:** SUPER_ADMIN

**Request:**
```typescript
{
  name: string | null
  role: string | null
  isActive: boolean | null
}
```

#### 5.7.5 Desativar Admin

```
DELETE /api/v1/admin/users/{id}
```

**Role mínimo:** SUPER_ADMIN

**Nota:** Soft delete — marca como `isActive: false`. Não pode desativar a si mesmo.

**UI sugerida:**
- Tabela com (nome, email, role, status, criado em)
- Modal de criação com campos obrigatórios
- Edição inline ou modal para alterar role
- Toggle para ativar/desativar
- Somente visível para SUPER_ADMIN

---

### 5.8 Auditoria

```
GET /api/v1/admin/audit
```

**Query Params (esperados):**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `userId` | string? | Filtrar por ator |
| `action` | string? | Filtrar por tipo de ação |
| `resourceType` | string? | Filtrar por tipo de recurso |
| `skip` | int | Offset |
| `limit` | int | Itens por página |

**Response:**
```typescript
{
  data: [
    {
      id: string
      userId: string
      userType: "MERCHANT" | "ADMIN" | "SYSTEM"
      merchantId: string | null
      action: string                     // Ex: "CREATE_PAYMENT", "UPDATE_MERCHANT_STATUS"
      resourceType: string               // Ex: "PAYMENT", "MERCHANT", "WITHDRAWAL"
      resourceId: string
      changes: {
        before: object | null            // Estado anterior
        after: object | null             // Estado posterior
      } | null
      ipAddress: string
      createdAt: string
    }
  ]
}
```

**UI sugerida:**
- Timeline/tabela cronológica reversa
- Filtros: ator (dropdown de admins), ação, tipo de recurso, período
- Expandir item para ver `changes.before` e `changes.after` (diff visual)
- Link para o recurso afetado (merchant, pagamento, etc.)
- Exportação para CSV (se implementado)

**Ações comuns logadas:**
| Ação | Descrição |
|------|-----------|
| `CREATE_PAYMENT` | Pagamento criado |
| `CANCEL_PAYMENT` | Pagamento cancelado |
| `CREATE_WITHDRAWAL` | Saque solicitado |
| `UPDATE_MERCHANT_STATUS` | Status do merchant alterado |
| `REVIEW_MERCHANT_VERIFICATION` | Verificação KYC revisada |
| `CREATE_FEE_RULE` | Regra de taxa criada |
| `DELETE_FEE_RULE` | Regra de taxa excluída |
| `CREATE_ADMIN` | Admin criado |
| `DEACTIVATE_ADMIN` | Admin desativado |
| `RESOLVE_DISPUTE` | Disputa resolvida |

---

### 5.9 Provedores

```
GET /api/v1/admin/providers
```

**Response:**
```typescript
{
  data: [
    {
      name: string                       // Ex: "transfeera"
      type: string                       // "PAYMENT" | "BANKING"
      isActive: boolean
      supportedMethods: string[]         // Ex: ["PIX", "BOLETO"]
      // Outros campos de configuração (sem secrets expostos)
    }
  ]
}
```

**UI sugerida:**
- Cards por provedor (nome, tipo, métodos suportados, status)
- Indicador visual de saúde/disponibilidade (se disponível)
- Leitura somente (configuração via env vars, não pela UI)

---

### 5.10 Diagnósticos

#### 5.10.1 Listar Logs HTTP

```
GET /api/v1/diagnostics/logs
```

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `dateFrom` | string? | ISO 8601 — início do período |
| `dateTo` | string? | ISO 8601 — fim do período |
| `level` | string? | Nível do log |
| `statusCode` | int? | Código HTTP da resposta |
| `method` | string? | HTTP method (GET, POST, etc.) |
| `path` | string? | Filtrar por path (substring) |
| `traceId` | string? | Filtrar por trace ID |
| `merchantId` | string? | Filtrar por merchant |
| `hasError` | boolean? | Apenas requisições com erro |
| `skip` | int | Offset |
| `limit` | int | Itens por página |

**Response:**
```typescript
{
  data: {
    items: [
      {
        id: string
        traceId: string
        level: string
        method: string               // GET, POST, PUT, DELETE
        path: string                 // /api/v1/payments/pix
        statusCode: number
        durationMs: number           // Tempo de resposta em ms
        merchantId: string | null
        clientIp: string | null
        hasError: boolean
        errorMessage: string | null
        createdAt: string
      }
    ]
    total: number
    skip: number
    limit: number
  }
}
```

#### 5.10.2 Detalhe do Log

```
GET /api/v1/diagnostics/logs/{id}
```

**Response:**
```typescript
{
  data: {
    id: string
    traceId: string
    level: string
    method: string
    path: string
    queryString: string | null
    requestHeaders: Record<string, string> | null
    requestBody: string | null
    responseBody: string | null
    statusCode: number
    durationMs: number
    merchantId: string | null
    userId: string | null
    clientIp: string | null
    userAgent: string | null
    error: {
      message: string
      stackTrace: string | null
      type: string
    } | null
    createdAt: string
  }
}
```

#### 5.10.3 Logs por Trace ID

```
GET /api/v1/diagnostics/logs/trace/{traceId}
```

Retorna todos os logs com o mesmo `traceId` (útil para rastrear uma requisição inteira).

#### 5.10.4 Estatísticas

```
GET /api/v1/diagnostics/logs/stats
```

**Response:**
```typescript
{
  data: {
    // Estatísticas agregadas por path, status code, tempo de resposta médio
    // Estrutura varia — ver implementação do backend
  }
}
```

#### 5.10.5 Purgar Logs

```
DELETE /api/v1/diagnostics/logs?olderThanDays={days}
```

**Nota:** operação destrutiva — confirmar antes de executar.

**UI sugerida:**
- **Lista:** tabela com (traceId, método, path, status, duração, IP, data)
- **Filtros avançados:** todos os query params acima
- **Cor por status:** 2xx=verde, 4xx=amarelo, 5xx=vermelho
- **Detalhe:** painel lateral ou página com request/response bodies (formatados como JSON)
- **Trace view:** agrupar logs pelo mesmo traceId
- **Estatísticas:** gráficos de latência, distribuição de status codes, endpoints mais chamados
- **Busca por traceId:** campo de busca dedicado

---

### 5.11 Configuração da Plataforma

```
GET /api/v1/admin/config
```

**Response:** snapshot de configuração da plataforma (read-only via UI).

**Nota:** Configurações são alteradas via env vars e restart. Esta tela serve para visualizar o estado atual.

---

## 6. Contrato de API (RouteMessages)

Idêntico ao Seller. Toda resposta segue o envelope:

```json
{
  "responseType": "OK",
  "message": "...",
  "title": "...",
  "status": 200,
  "data": { ... },
  "extendedResultCode": "...",
  "date": "2026-03-23T12:00:00.000Z"
}
```

---

## 7. Enums e Constantes

### Status de Merchant
| Valor | Cor sugerida | Descrição |
|-------|-------------|-----------|
| `PENDING` | Amarelo | Pendente de aprovação |
| `ACTIVE` | Verde | Ativo |
| `SUSPENDED` | Laranja | Suspenso |
| `BLOCKED` | Vermelho | Bloqueado |

### Status de Verificação
| Valor | Cor sugerida | Descrição |
|-------|-------------|-----------|
| `UNVERIFIED` | Cinza | Não verificado |
| `PENDING_REVIEW` | Amarelo | Aguardando revisão |
| `VERIFIED` | Verde | Verificado |
| `REJECTED` | Vermelho | Rejeitado |

### Status de Pagamento
| Valor | Cor sugerida |
|-------|-------------|
| `CREATED` | Cinza |
| `PENDING` | Amarelo |
| `PAID` | Verde |
| `FAILED` | Vermelho |
| `CANCELLED` | Cinza escuro |
| `REFUNDED` | Azul |
| `EXPIRED` | Laranja |

### Status de Saque
| Valor | Cor sugerida |
|-------|-------------|
| `REQUESTED` | Amarelo |
| `PROCESSING` | Azul |
| `COMPLETED` | Verde |
| `FAILED` | Vermelho |
| `CANCELLED` | Cinza |

### Status de Disputa
| Valor | Cor sugerida |
|-------|-------------|
| `OPEN` | Vermelho |
| `UNDER_REVIEW` | Amarelo |
| `ACCEPTED` | Verde |
| `REJECTED` | Cinza escuro |
| `RESOLVED` | Azul |

### Tipo de Disputa
| Valor | Label |
|-------|-------|
| `MED` | MED (Mecanismo Especial de Devolução) |
| `CHARGEBACK` | Chargeback |
| `REFUND_REQUEST` | Solicitação de Estorno |

### Tipo de Taxa
| Valor | Label |
|-------|-------|
| `PIX` | PIX |
| `BOLETO` | Boleto |
| `CREDIT_CARD` | Cartão de Crédito |
| `DEBIT_CARD` | Cartão de Débito |
| `WITHDRAWAL` | Saque |
| `ANTICIPATION` | Antecipação |

### Cálculo de Taxa
| Valor | Descrição |
|-------|-----------|
| `PERCENTAGE` | Apenas percentual |
| `FIXED` | Apenas valor fixo |
| `PERCENTAGE_PLUS_FIXED` | Percentual + fixo |

### Roles de Admin
| Valor | Nível |
|-------|-------|
| `SUPER_ADMIN` | 4 — Acesso total |
| `ADMIN` | 3 — Quase tudo |
| `SUPPORT` | 2 — Ações de suporte |
| `VIEWER` | 1 — Somente leitura |

### Método de Pagamento
| Valor | Label |
|-------|-------|
| `PIX` | PIX |
| `BOLETO` | Boleto |
| `CREDIT_CARD` | Cartão de Crédito |
| `DEBIT_CARD` | Cartão de Débito |

### Tipo de Chave PIX
| Valor | Descrição |
|-------|-----------|
| `CPF` | CPF (11 dígitos) |
| `CNPJ` | CNPJ (14 dígitos) |
| `EMAIL` | Email |
| `PHONE` | Telefone (+55) |
| `RANDOM` | Chave aleatória (UUID) |

### Tipos de Documento KYC
| Valor | Label |
|-------|-------|
| `IDENTITY_FRONT` | Frente do documento |
| `IDENTITY_BACK` | Verso do documento |
| `SELFIE` | Selfie com documento |
| `PROOF_OF_ADDRESS` | Comprovante de endereço |
| `ARTICLES_OF_INCORPORATION` | Contrato social |
| `OTHER` | Outro |

### Tipo de Ambiente (API Keys)
| Valor | Descrição |
|-------|-----------|
| `LIVE` | Produção |
| `TEST` | Sandbox |

### Tipo de Entrada no Ledger
| Valor | Direção |
|-------|---------|
| `CREDIT` | + |
| `DEBIT` | - |
| `RETENTION` | - |
| `RETENTION_RELEASE` | + |
| `FEE_DEDUCTION` | - |
| `ANTICIPATION` | + |

### Tipo de Ator (Audit)
| Valor | Descrição |
|-------|-----------|
| `MERCHANT` | Ação feita por merchant |
| `ADMIN` | Ação feita por admin |
| `SYSTEM` | Ação automática do sistema |

### Eventos de Webhook
| Valor | Descrição |
|-------|-----------|
| `payment.created` | Pagamento criado |
| `payment.paid` | Pagamento confirmado |
| `payment.failed` | Pagamento falhou |
| `payment.expired` | Pagamento expirou |
| `payment.cancelled` | Pagamento cancelado |
| `payment.refunded` | Pagamento estornado |
| `withdrawal.requested` | Saque solicitado |
| `withdrawal.completed` | Saque concluído |
| `withdrawal.failed` | Saque falhou |
| `dispute.opened` | Disputa aberta |
| `dispute.resolved` | Disputa resolvida |
| `merchant.verified` | Merchant verificado |

---

## 8. Controle de Acesso por Role

A UI deve ocultar ações e menus baseados no role do admin logado:

| Feature / Ação | VIEWER | SUPPORT | ADMIN | SUPER_ADMIN |
|----------------|--------|---------|-------|-------------|
| Dashboard (visualizar) | ✅ | ✅ | ✅ | ✅ |
| Merchants (listar) | ✅ | ✅ | ✅ | ✅ |
| Merchants (detalhe) | ✅ | ✅ | ✅ | ✅ |
| Merchants (criar) | ❌ | ❌ | ✅ | ✅ |
| Merchants (alterar status) | ❌ | ✅ | ✅ | ✅ |
| Merchants (review KYC) | ❌ | ✅ | ✅ | ✅ |
| Merchants (alterar settings) | ❌ | ❌ | ✅ | ✅ |
| Merchants (criar credentials) | ❌ | ❌ | ✅ | ✅ |
| Transações (listar) | ✅ | ✅ | ✅ | ✅ |
| Disputas (listar) | ✅ | ✅ | ✅ | ✅ |
| Disputas (resolver) | ❌ | ✅ | ✅ | ✅ |
| Taxas (listar) | ✅ | ✅ | ✅ | ✅ |
| Taxas (criar/editar/excluir) | ❌ | ❌ | ✅ | ✅ |
| Taxas (simular) | ✅ | ✅ | ✅ | ✅ |
| Admins (listar) | ❌ | ❌ | ❌ | ✅ |
| Admins (criar/editar/desativar) | ❌ | ❌ | ❌ | ✅ |
| Auditoria (listar) | ✅ | ✅ | ✅ | ✅ |
| Provedores (listar) | ✅ | ✅ | ✅ | ✅ |
| Diagnósticos (listar) | ❌ | ❌ | ✅ | ✅ |
| Diagnósticos (purgar) | ❌ | ❌ | ❌ | ✅ |
| Configuração (visualizar) | ❌ | ❌ | ✅ | ✅ |

**Implementação:**
1. Decodificar JWT para extrair `role`
2. Criar helper `hasPermission(role, requiredRole)` → compara nível
3. Usar em route guards E na renderização de botões/menus
4. Se o backend retornar 403, exibir mensagem de acesso negado

---

## 9. Guia de Navegação e Rotas

```
/login                              → Tela de login admin

/dashboard                          → Dashboard global

/merchants                          → Lista de merchants
/merchants/:id                      → Detalhe do merchant (com abas)
/merchants/:id/verification         → Review de KYC
/merchants/:id/settings             → Configurações do merchant
/merchants/new                      → Criar merchant (ADMIN+)
/merchants/pending-verification     → Merchants pendentes de verificação

/transactions/payments              → Pagamentos cross-merchant
/transactions/payments/:id          → Detalhe do pagamento
/transactions/withdrawals           → Saques cross-merchant
/transactions/withdrawals/:id       → Detalhe do saque

/disputes                           → Lista de disputas
/disputes/:id                       → Detalhe e resolução de disputa

/fees                               → Lista de regras de taxas
/fees/new                           → Criar regra
/fees/:id                           → Editar regra
/fees/simulate                      → Simulador de taxas

/admin-users                        → Lista de admins (SUPER_ADMIN)
/admin-users/new                    → Criar admin
/admin-users/:id                    → Editar admin

/audit                              → Audit log

/providers                          → Provedores de pagamento

/diagnostics                        → Logs HTTP
/diagnostics/:id                    → Detalhe do log
/diagnostics/trace/:traceId         → Logs por trace

/config                             → Configuração da plataforma
```

**Route Guards:**
- `/login` → redirecionar para `/dashboard` se já autenticado
- Todas as outras rotas → redirecionar para `/login` se não autenticado
- Rotas de admin-users → verificar `SUPER_ADMIN`
- Rotas de diagnósticos → verificar `ADMIN+`
- Ações de escrita → verificar role mínimo conforme tabela da seção 8

---

**Sidebar sugerida:**

```
📊 Dashboard
👥 Merchants
   ├── Todos os Merchants
   └── Verificações Pendentes
💳 Transações
   ├── Pagamentos
   └── Saques
⚠️  Disputas
💰 Taxas
   ├── Regras
   └── Simulador
👤 Administradores         ← só SUPER_ADMIN
📋 Auditoria
🔌 Provedores
🔍 Diagnósticos            ← só ADMIN+
⚙️  Configuração            ← só ADMIN+
```

---

> **Nota final:** Esta documentação cobre todos os endpoints que o Frontend Admin consome. Para dúvidas sobre a arquitetura de pastas e padrões de código, consultar `murillo's-architecture-frontend.md`. Para regras inegociáveis do projeto, consultar `PROJECT_RULES.md`.
