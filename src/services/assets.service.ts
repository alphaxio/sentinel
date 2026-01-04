// Assets Service

import apiService from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Asset, PaginatedResponse } from '@/types';

// Backend response format
interface BackendAsset {
  asset_id: string;
  name: string;
  type: string;
  classification_level: string;
  owner_id: string;
  confidentiality_score: number;
  integrity_score: number;
  availability_score: number;
  sensitivity_score: number;
  technology_stack?: string[];
  created_at: string;
}

// Map backend asset to frontend format
const mapBackendAsset = (backendAsset: BackendAsset | null | undefined): Asset => {
  if (!backendAsset) {
    throw new Error("Invalid asset data received from server");
  }
  
  return {
    id: backendAsset.asset_id,
    name: backendAsset.name,
    type: backendAsset.type as Asset['type'],
    owner: '', // Will need to fetch owner name separately or join
    ownerId: backendAsset.owner_id,
    classification: backendAsset.classification_level as Asset['classification'],
    confidentiality: backendAsset.confidentiality_score,
    integrity: backendAsset.integrity_score,
    availability: backendAsset.availability_score,
    sensitivityScore: parseFloat(backendAsset.sensitivity_score.toString()),
    status: 'Active', // Default - backend doesn't have this field yet
    environment: 'Production', // Default - backend doesn't have this field yet
    lastScanned: new Date().toISOString(), // Default - will need to fetch from scans
    threatCount: 0, // Will need to fetch separately
    findingsCount: 0, // Will need to fetch separately
    technologyStack: backendAsset.technology_stack,
    createdAt: backendAsset.created_at,
  };
};

export const assetsService = {
  getAll: async (params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<Asset>> => {
    // Backend uses snake_case, frontend uses camelCase
    const backendResponse = await apiService.getPaginated<BackendAsset>(API_ENDPOINTS.assets.list, {
      page: params?.page || 1,
      page_size: params?.pageSize || 50,
      search: params?.search,
    });
    
    // Map backend response (snake_case) to frontend format (camelCase)
    const response = backendResponse as any;
    return {
      items: response.items.map(mapBackendAsset),
      total: response.total,
      page: response.page,
      pageSize: response.page_size || response.pageSize || 50,
      totalPages: response.total_pages || response.totalPages || 1,
    };
  },

  getById: async (id: string): Promise<Asset> => {
    const backendAsset = await apiService.get<BackendAsset>(API_ENDPOINTS.assets.detail(id));
    return mapBackendAsset(backendAsset);
  },

  create: async (data: Partial<Asset>): Promise<Asset> => {
    // Map frontend format to backend format
    const backendData = {
      name: data.name,
      type: data.type,
      classification_level: data.classification,
      owner_id: data.ownerId,
      confidentiality_score: data.confidentiality,
      integrity_score: data.integrity,
      availability_score: data.availability,
      technology_stack: data.technologyStack,
    };
    
    const backendAsset = await apiService.post<BackendAsset>(API_ENDPOINTS.assets.create, backendData);
    return mapBackendAsset(backendAsset);
  },

  update: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    // Map frontend format to backend format
    const backendData: any = {};
    if (data.name !== undefined) backendData.name = data.name;
    if (data.type !== undefined) backendData.type = data.type;
    if (data.classification !== undefined) backendData.classification_level = data.classification;
    if (data.ownerId !== undefined) backendData.owner_id = data.ownerId;
    if (data.confidentiality !== undefined) backendData.confidentiality_score = data.confidentiality;
    if (data.integrity !== undefined) backendData.integrity_score = data.integrity;
    if (data.availability !== undefined) backendData.availability_score = data.availability;
    if (data.technologyStack !== undefined) backendData.technology_stack = data.technologyStack;
    
    const backendAsset = await apiService.patch<BackendAsset>(API_ENDPOINTS.assets.update(id), backendData);
    return mapBackendAsset(backendAsset);
  },

  delete: async (id: string): Promise<void> => {
    return apiService.delete(API_ENDPOINTS.assets.delete(id));
  },

  bulkImport: async (file: File): Promise<{ total: number; created: number; updated: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post<{ total: number; created: number; updated: number; errors: string[] }>(
      API_ENDPOINTS.assets.bulkImport,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  getRelationships: async (id: string): Promise<any[]> => {
    return apiService.get<any[]>(API_ENDPOINTS.assets.relationships(id));
  },

  createRelationship: async (assetId: string, targetAssetId: string, relationshipType: string): Promise<any> => {
    return apiService.post<any>(API_ENDPOINTS.assets.relationships(assetId), {
      target_asset_id: targetAssetId,
      relationship_type: relationshipType,
    });
  },

  deleteRelationship: async (relationshipId: string): Promise<void> => {
    return apiService.delete(`/assets/relationships/${relationshipId}`);
  },

  getThreats: async (id: string): Promise<any[]> => {
    return apiService.get<any[]>(API_ENDPOINTS.assets.threats(id));
  },

  getFindings: async (id: string): Promise<any[]> => {
    return apiService.get<any[]>(API_ENDPOINTS.assets.findings(id));
  },
};



