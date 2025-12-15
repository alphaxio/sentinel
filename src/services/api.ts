// API Service Layer with Axios

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api';
import type { ApiResponse, PaginatedResponse } from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_CONFIG.baseURL}${API_CONFIG.apiVersion}`,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    // Get token from memory (not localStorage for security)
    return sessionStorage.getItem('auth_token');
  }

  private clearAuthToken(): void {
    sessionStorage.removeItem('auth_token');
  }

  public setAuthToken(token: string): void {
    sessionStorage.setItem('auth_token', token);
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error
      const message = (error.response.data as any)?.message || error.message;
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error - please check your connection');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Generic methods
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  async getPaginated<T>(url: string, params?: any): Promise<PaginatedResponse<T>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<T>>>(url, { params });
    return response.data.data;
  }
}

export const apiService = new ApiService();
export default apiService;

