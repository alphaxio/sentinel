// Dashboard Redux Slice

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

interface DashboardMetrics {
  totalAssets: number;
  activeThreats: number;
  openFindings: number;
  criticalFindings: number;
  complianceScore: number;
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  metrics: null,
  loading: false,
  error: null,
};

export const fetchDashboardMetrics = createAsyncThunk('dashboard/fetchMetrics', async () => {
  return apiService.get<DashboardMetrics>(API_ENDPOINTS.dashboard.metrics);
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard metrics';
      });
  },
});

export default dashboardSlice.reducer;

