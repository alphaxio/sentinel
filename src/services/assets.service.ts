// Assets Service

import apiService from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Asset, PaginatedResponse } from '@/types';

export const assetsService = {
  getAll: async (params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<Asset>> => {
    return apiService.getPaginated<Asset>(API_ENDPOINTS.assets.list, params);
  },

  getById: async (id: string): Promise<Asset> => {
    return apiService.get<Asset>(API_ENDPOINTS.assets.detail(id));
  },

  create: async (data: Partial<Asset>): Promise<Asset> => {
    return apiService.post<Asset>(API_ENDPOINTS.assets.create, data);
  },

  update: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    return apiService.patch<Asset>(API_ENDPOINTS.assets.update(id), data);
  },

  delete: async (id: string): Promise<void> => {
    return apiService.delete(API_ENDPOINTS.assets.delete(id));
  },

  bulkImport: async (file: File): Promise<{ imported: number; errors: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(API_ENDPOINTS.assets.bulkImport, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getRelationships: async (id: string): Promise<any[]> => {
    return apiService.get<any[]>(API_ENDPOINTS.assets.relationships(id));
  },

  getThreats: async (id: string): Promise<any[]> => {
    return apiService.get<any[]>(API_ENDPOINTS.assets.threats(id));
  },

  getFindings: async (id: string): Promise<any[]> => {
    return apiService.get<any[]>(API_ENDPOINTS.assets.findings(id));
  },
};

