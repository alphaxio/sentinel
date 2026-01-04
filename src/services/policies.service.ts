// Policies Service

import apiService from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { PaginatedResponse } from '@/types';

export type PolicySeverity = 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';
export type GateDecision = 'Pass' | 'Warn' | 'Block';

export interface PolicyRule {
  policy_rule_id: string;
  name: string;
  description?: string;
  severity: PolicySeverity;
  rego_snippet?: string;
  active: boolean;
  version: number;
  last_evaluated?: string;
  created_at: string;
  updated_at: string;
  
  // Enriched fields
  violations_count?: number;
  controls_mapped_count?: number;
  pass_rate?: number;
  framework?: string;
}

export interface PolicyRuleCreate {
  name: string;
  description?: string;
  severity: PolicySeverity;
  rego_snippet?: string;
  active?: boolean;
}

export interface PolicyRuleUpdate {
  name?: string;
  description?: string;
  severity?: PolicySeverity;
  rego_snippet?: string;
  active?: boolean;
}

export interface PolicyViolation {
  violation_id: string;
  finding_id: string;
  policy_rule_id: string;
  gate_decision: GateDecision;
  evaluated_at: string;
  policy_name?: string;
  finding_title?: string;
}

export interface PolicyTestRequest {
  test_data: Record<string, any>;
}

export interface PolicyTestResponse {
  passed: boolean;
  gate_decision: GateDecision;
  message?: string;
  violations?: Array<Record<string, any>>;
}

export const policiesService = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    activeOnly?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<PolicyRule>> => {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      page_size: params?.pageSize || 50,
    };
    if (params?.activeOnly !== undefined) {
      queryParams.active_only = params.activeOnly;
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiService.getPaginated<PolicyRule>(
      API_ENDPOINTS.policies.list,
      queryParams
    );
    return response as any;
  },

  getById: async (id: string): Promise<PolicyRule> => {
    return apiService.get<PolicyRule>(API_ENDPOINTS.policies.detail(id));
  },

  create: async (data: PolicyRuleCreate): Promise<PolicyRule> => {
    return apiService.post<PolicyRule>(API_ENDPOINTS.policies.create, data);
  },

  update: async (id: string, data: PolicyRuleUpdate): Promise<PolicyRule> => {
    return apiService.patch<PolicyRule>(API_ENDPOINTS.policies.update(id), data);
  },

  delete: async (id: string): Promise<void> => {
    return apiService.delete(API_ENDPOINTS.policies.delete(id));
  },

  test: async (id: string, testData: Record<string, any>): Promise<PolicyTestResponse> => {
    return apiService.post<PolicyTestResponse>(
      API_ENDPOINTS.policies.test(id),
      { test_data: testData }
    );
  },

  getViolations: async (
    policyId: string,
    params?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResponse<PolicyViolation>> => {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      page_size: params?.pageSize || 50,
    };

    const response = await apiService.getPaginated<PolicyViolation>(
      API_ENDPOINTS.policies.violations(policyId),
      queryParams
    );
    return response as any;
  },
};

