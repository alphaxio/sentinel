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
    oauth2Config: '/auth/oauth2/config',
    oauth2Authorize: '/auth/oauth2/authorize',
    oauth2Callback: '/auth/oauth2/callback',
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
    delete: (id: string) => `/threats/${id}`,
    transition: (id: string) => `/threats/${id}/transition`,
    history: (id: string) => `/threats/${id}/history`,
    riskHeatmap: '/threats/analytics/risk-heatmap',
    register: '/threats/register',
    diagrams: {
      list: '/threats/diagrams',
      detail: (id: string) => `/threats/diagrams/${id}`,
      create: '/threats/diagrams',
      update: (id: string) => `/threats/diagrams/${id}`,
      delete: (id: string) => `/threats/diagrams/${id}`,
    },
  },
  // Findings
  findings: {
    list: '/findings',
    detail: (id: string) => `/findings/${id}`,
    create: '/findings',
    update: (id: string) => `/findings/${id}`,
    delete: (id: string) => `/findings/${id}`,
    byAsset: (assetId: string) => `/findings/asset/${assetId}`,
    byThreat: (threatId: string) => `/findings/threat/${threatId}`,
  },
  // Policies
  policies: {
    list: '/policies',
    detail: (id: string) => `/policies/${id}`,
    create: '/policies',
    update: (id: string) => `/policies/${id}`,
    delete: (id: string) => `/policies/${id}`,
    test: (id: string) => `/policies/${id}/test`,
    violations: (id: string) => `/policies/${id}/violations`,
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
    detail: (id: string) => `/risk-acceptances/${id}`,
    create: '/risk-acceptances',
    update: (id: string) => `/risk-acceptances/${id}`,
    delete: (id: string) => `/risk-acceptances/${id}`,
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



