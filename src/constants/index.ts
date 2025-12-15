// Application Constants

export const ASSET_TYPES = [
  'Application',
  'Database',
  'Server',
  'Network',
  'Cloud',
  'Container',
  'Microservice',
  'Infrastructure',
] as const;

export const CLASSIFICATION_LEVELS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const;

export const THREAT_STATUSES = [
  'Identified',
  'Assessed',
  'Verified',
  'Evaluated',
  'Planning',
  'Mitigated',
  'Accepted',
  'Monitoring',
] as const;

export const FINDING_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'] as const;

export const FINDING_STATUSES = ['Open', 'In Progress', 'Resolved', 'False Positive', 'Accepted'] as const;

export const COMPLIANCE_FRAMEWORKS = ['NIST_800_53', 'ISO_27001', 'PCI_DSS', 'HIPAA', 'GDPR'] as const;

export const RISK_CATEGORIES = {
  LOW: { min: 0, max: 24, label: 'Low' },
  MEDIUM: { min: 25, max: 49, label: 'Medium' },
  HIGH: { min: 50, max: 74, label: 'High' },
  CRITICAL: { min: 75, max: 100, label: 'Critical' },
} as const;

export const PAGINATION_DEFAULT = {
  page: 1,
  pageSize: 50,
} as const;

