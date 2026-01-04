// Threats Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { threatsService } from '@/services/threats.service';
import type { Threat, PaginatedResponse } from '@/types';

interface ThreatsState {
  items: Threat[];
  selectedThreat: Threat | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ThreatsState = {
  items: [],
  selectedThreat: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchThreats = createAsyncThunk(
  'threats/fetchAll',
  async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    assetId?: string;
  }) => {
    return threatsService.getAll(params);
  }
);

export const fetchThreatById = createAsyncThunk('threats/fetchById', async (id: string) => {
  return threatsService.getById(id);
});

export const createThreat = createAsyncThunk('threats/create', async (data: Partial<Threat>) => {
  return threatsService.create(data);
});

export const updateThreat = createAsyncThunk(
  'threats/update',
  async ({ id, data }: { id: string; data: Partial<Threat> }) => {
    return threatsService.update(id, data);
  }
);

export const transitionThreat = createAsyncThunk(
  'threats/transition',
  async ({ id, toState, comment }: { id: string; toState: Threat['status']; comment?: string }) => {
    return threatsService.transition(id, toState, comment);
  }
);

export const deleteThreat = createAsyncThunk('threats/delete', async (id: string) => {
  await threatsService.delete(id);
  return id;
});

const threatsSlice = createSlice({
  name: 'threats',
  initialState,
  reducers: {
    setSelectedThreat: (state, action: PayloadAction<Threat | null>) => {
      state.selectedThreat = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchThreats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreats.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchThreats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch threats';
      })
      // Fetch by ID
      .addCase(fetchThreatById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreatById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedThreat = action.payload;
      })
      .addCase(fetchThreatById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch threat';
      })
      // Create
      .addCase(createThreat.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      })
      // Update
      .addCase(updateThreat.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedThreat?.id === action.payload.id) {
          state.selectedThreat = action.payload;
        }
      })
      // Transition
      .addCase(transitionThreat.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedThreat?.id === action.payload.id) {
          state.selectedThreat = action.payload;
        }
      })
      // Delete
      .addCase(deleteThreat.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedThreat?.id === action.payload) {
          state.selectedThreat = null;
        }
      });
  },
});

export const { setSelectedThreat, clearError } = threatsSlice.actions;
export default threatsSlice.reducer;



