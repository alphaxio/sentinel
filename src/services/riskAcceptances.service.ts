// Risk Acceptances Service

import apiService from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { PaginatedResponse } from '@/types';

export interface RiskAcceptance {
  acceptance_id: string;
  threat_id: string;
  requested_by: string;
  approved_by?: string;
  justification: string;
  acceptance_period_days: number;
  expiration_date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  approval_signature_name?: string;
  approval_signature_timestamp?: string;
  created_at: string;
  updated_at: string;
  // Enriched fields
  requester_name?: string;
  approver_name?: string;
  threat_title?: string;
  threat_risk_score?: number;
}

export interface RiskAcceptanceCreate {
  threat_id: string;
  justification: string;
  acceptance_period_days: number;
}

export interface RiskAcceptanceUpdate {
  justification?: string;
  acceptance_period_days?: number;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
}

export const riskAcceptancesService = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    threatId?: string;
    status?: string;
    requestedBy?: string;
  }): Promise<PaginatedResponse<RiskAcceptance>> => {
    const queryParams: any = {
      page: params?.page || 1,
      page_size: params?.pageSize || 50,
    };
    
    if (params?.threatId) {
      queryParams.threat_id = params.threatId;
    }
    
    if (params?.status) {
      queryParams.status = params.status;
    }
    
    if (params?.requestedBy) {
      queryParams.requested_by = params.requestedBy;
    }
    
    const response = await apiService.getPaginated<RiskAcceptance>(
      API_ENDPOINTS.riskAcceptances.list,
      queryParams
    );
    return response as any;
  },

  getById: async (id: string): Promise<RiskAcceptance> => {
    return apiService.get<RiskAcceptance>(API_ENDPOINTS.riskAcceptances.detail(id));
  },

  create: async (data: RiskAcceptanceCreate): Promise<RiskAcceptance> => {
    return apiService.post<RiskAcceptance>(API_ENDPOINTS.riskAcceptances.create, data);
  },

  update: async (id: string, data: RiskAcceptanceUpdate): Promise<RiskAcceptance> => {
    return apiService.patch<RiskAcceptance>(API_ENDPOINTS.riskAcceptances.update(id), data);
  },

  delete: async (id: string): Promise<void> => {
    return apiService.delete(API_ENDPOINTS.riskAcceptances.delete(id));
  },

  approve: async (id: string, approvalSignatureName?: string): Promise<RiskAcceptance> => {
    const params = approvalSignatureName ? { approval_signature_name: approvalSignatureName } : {};
    return apiService.post<RiskAcceptance>(
      API_ENDPOINTS.riskAcceptances.approve(id),
      {},
      { params }
    );
  },

  reject: async (id: string): Promise<RiskAcceptance> => {
    return apiService.post<RiskAcceptance>(API_ENDPOINTS.riskAcceptances.reject(id), {});
  },
};

