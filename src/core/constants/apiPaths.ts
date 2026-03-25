export const API_PATHS = {
  // Auth
  AUTH_ADMIN_LOGIN: '/api/v1/auth/admin/login',
  AUTH_REFRESH: '/api/v1/auth/refresh',

  // Admin Users
  ADMIN_USERS: '/api/v1/admin/users',
  ADMIN_USER: (id: string) => `/api/v1/admin/users/${id}`,

  // Merchants
  ADMIN_MERCHANTS: '/api/v1/admin/merchants',
  ADMIN_MERCHANT: (id: string) => `/api/v1/admin/merchants/${id}`,
  ADMIN_MERCHANT_STATUS: (id: string) => `/api/v1/admin/merchants/${id}/status`,
  ADMIN_MERCHANT_VERIFICATION: (id: string) => `/api/v1/admin/merchants/${id}/verification`,
  ADMIN_MERCHANT_SETTINGS: (id: string) => `/api/v1/admin/merchants/${id}/settings`,
  ADMIN_MERCHANT_CREDENTIALS: (id: string) => `/api/v1/admin/merchants/${id}/credentials`,

  // Transactions
  ADMIN_PAYMENTS: '/api/v1/admin/payments',
  ADMIN_PAYMENT: (id: string) => `/api/v1/admin/payments/${id}`,
  ADMIN_WITHDRAWALS: '/api/v1/admin/withdrawals',
  ADMIN_WITHDRAWAL: (id: string) => `/api/v1/admin/withdrawals/${id}`,

  // Disputes
  ADMIN_DISPUTES: '/api/v1/admin/disputes',
  ADMIN_DISPUTE: (id: string) => `/api/v1/admin/disputes/${id}`,

  // Fees
  FEES_RULES: '/api/v1/fees/rules',
  FEES_RULE: (id: string) => `/api/v1/fees/rules/${id}`,
  FEES_SIMULATE: '/api/v1/fees/simulate',
  FEES_MERCHANT_RULES: (merchantId: string) => `/api/v1/fees/merchants/${merchantId}/rules`,

  // Audit
  ADMIN_AUDIT: '/api/v1/admin/audit',

  // Providers
  ADMIN_PROVIDERS: '/api/v1/admin/providers',

  // Config
  ADMIN_CONFIG: '/api/v1/admin/config',

  // Diagnostics
  DIAGNOSTICS_LOGS: '/api/v1/diagnostics/logs',
  DIAGNOSTICS_LOG: (id: string) => `/api/v1/diagnostics/logs/${id}`,
  DIAGNOSTICS_TRACE: (traceId: string) => `/api/v1/diagnostics/logs/trace/${traceId}`,
  DIAGNOSTICS_STATS: '/api/v1/diagnostics/logs/stats',

  // Dashboard
  DASHBOARD_ADMIN: '/api/v1/dashboard/admin',
  DASHBOARD_ADMIN_SERIES: (period: string) => `/api/v1/dashboard/admin/series?period=${period}`
} as const;
