// API Configuration

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  apiVersion: '/v1',
  timeout: 30000,
} as const;

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
  },
  // Assets
  assets: {
    list: '/assets',
    detail: (id: string) => `/assets/${id}`,
    create: '/assets',
    update: (id: string) => `/assets/${id}`,
    delete: (id: string) => `/assets/${id}`,
    bulkImport: '/assets/bulk-import',
    relationships: (id: string) => `/assets/${id}/relationships`,
    threats: (id: string) => `/assets/${id}/threats`,
    findings: (id: string) => `/assets/${id}/findings`,
  },
  // Threats
  threats: {
    list: '/threats',
    detail: (id: string) => `/threats/${id}`,
    create: '/threats',
    update: (id: string) => `/threats/${id}`,
    transition: (id: string) => `/threats/${id}/transition`,
    history: (id: string) => `/threats/${id}/history`,
    register: '/threats/register',
  },
  // Findings
  findings: {
    list: '/findings',
    detail: (id: string) => `/findings/${id}`,
    update: (id: string) => `/findings/${id}`,
  },
  // Policies
  policies: {
    list: '/policies',
    detail: (id: string) => `/policies/${id}`,
    create: '/policies',
    update: (id: string) => `/policies/${id}`,
    test: (id: string) => `/policies/${id}/test`,
  },
  // Compliance
  compliance: {
    controls: '/controls',
    coverage: '/compliance/coverage',
    reports: {
      generate: '/compliance/reports',
      detail: (id: string) => `/compliance/reports/${id}`,
    },
  },
  // Risk Acceptances
  riskAcceptances: {
    list: '/risk-acceptances',
    create: '/risk-acceptances',
    approve: (id: string) => `/risk-acceptances/${id}/approve`,
    reject: (id: string) => `/risk-acceptances/${id}/reject`,
  },
  // Dashboard
  dashboard: {
    metrics: '/dashboard/metrics',
    riskHeatmap: '/dashboard/risk-heatmap',
    trends: '/analytics/trends',
  },
  // Webhooks
  webhooks: {
    scanResults: (scannerType: string) => `/webhooks/scan-results/${scannerType}`,
  },
} as const;

