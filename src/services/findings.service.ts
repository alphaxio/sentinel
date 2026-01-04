// Findings Service

import apiService from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Finding, PaginatedResponse } from '@/types';

// Backend response format
interface BackendFinding {
  finding_id: string;
  asset_id: string;
  asset_name?: string;
  vulnerability_type: string;
  severity: string;
  location?: string;
  cve_id?: string;
  scan_result_id?: string;
  threat_id?: string;
  status: string;
  scanner_sources?: string[];
  first_detected: string;
  remediated_at?: string;
}

// Map backend status to frontend status
const mapBackendStatus = (backendStatus: string): Finding['status'] => {
  const statusMap: Record<string, Finding['status']> = {
    'Open': 'Open',
    'In_Progress': 'In Progress',
    'Remediated': 'Resolved',
    'False_Positive': 'False Positive',
    'Accepted': 'Accepted',
  };
  return statusMap[backendStatus] || 'Open';
};

// Map backend finding to frontend format
const mapBackendFinding = (backendFinding: BackendFinding): Finding => {
  return {
    id: backendFinding.finding_id,
    title: backendFinding.vulnerability_type,
    assetId: backendFinding.asset_id,
    assetName: backendFinding.asset_name || 'Unknown Asset',
    threatId: backendFinding.threat_id,
    vulnerabilityType: backendFinding.vulnerability_type,
    severity: backendFinding.severity as Finding['severity'],
    source: backendFinding.scanner_sources?.[0] as Finding['source'] || 'Manual',
    status: mapBackendStatus(backendFinding.status),
    cveId: backendFinding.cve_id,
    cvssScore: undefined, // Backend doesn't have this yet
    description: backendFinding.vulnerability_type, // Will need to fetch separately
    remediation: '', // Will need to fetch separately
    location: backendFinding.location,
    scannerSources: backendFinding.scanner_sources,
    discoveredAt: backendFinding.first_detected,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
    remediatedAt: backendFinding.remediated_at,
  };
};

export const findingsService = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    severity?: string;
    status?: string;
    assetId?: string;
    threatId?: string;
  }): Promise<PaginatedResponse<Finding>> => {
    const backendResponse = await apiService.getPaginated<BackendFinding>(
      API_ENDPOINTS.findings.list,
      {
        page: params?.page || 1,
        page_size: params?.pageSize || 50,
        search: params?.search,
        severity: params?.severity,
        status: params?.status,
        asset_id: params?.assetId,
        threat_id: params?.threatId,
      }
    );

    const response = backendResponse as any;
    return {
      items: response.items.map(mapBackendFinding),
      total: response.total,
      page: response.page,
      pageSize: response.page_size || response.pageSize || 50,
      totalPages: response.total_pages || response.totalPages || 1,
    };
  },

  getById: async (id: string): Promise<Finding> => {
    const backendFinding = await apiService.get<BackendFinding>(API_ENDPOINTS.findings.detail(id));
    return mapBackendFinding(backendFinding);
  },

  create: async (data: Partial<Finding>): Promise<Finding> => {
    const backendData = {
      asset_id: data.assetId,
      vulnerability_type: data.vulnerabilityType || data.title || '',
      severity: data.severity,
      location: data.location,
      cve_id: data.cveId,
      threat_id: data.threatId,
      scanner_sources: data.scannerSources,
    };

    const backendFinding = await apiService.post<BackendFinding>(
      API_ENDPOINTS.findings.create,
      backendData
    );
    return mapBackendFinding(backendFinding);
  },

  update: async (id: string, data: Partial<Finding>): Promise<Finding> => {
    const backendData: any = {};
    if (data.status !== undefined) {
      // Map frontend status to backend status
      const statusMap: Record<Finding['status'], string> = {
        'Open': 'Open',
        'In Progress': 'In_Progress',
        'Resolved': 'Remediated',
        'False Positive': 'False_Positive',
        'Accepted': 'Accepted',
      };
      backendData.status = statusMap[data.status] || data.status;
    }
    if (data.threatId !== undefined) backendData.threat_id = data.threatId;

    const backendFinding = await apiService.patch<BackendFinding>(
      API_ENDPOINTS.findings.update(id),
      backendData
    );
    return mapBackendFinding(backendFinding);
  },

  delete: async (id: string): Promise<void> => {
    return apiService.delete(API_ENDPOINTS.findings.delete(id));
  },

  getByAsset: async (assetId: string): Promise<Finding[]> => {
    const backendFindings = await apiService.get<BackendFinding[]>(
      API_ENDPOINTS.findings.byAsset(assetId)
    );
    return backendFindings.map(mapBackendFinding);
  },

  getByThreat: async (threatId: string): Promise<Finding[]> => {
    const backendFindings = await apiService.get<BackendFinding[]>(
      API_ENDPOINTS.findings.byThreat(threatId)
    );
    return backendFindings.map(mapBackendFinding);
  },
};

