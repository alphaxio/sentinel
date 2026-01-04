// Findings Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { findingsService } from '@/services/findings.service';
import type { Finding, PaginatedResponse } from '@/types';

interface FindingsState {
  items: Finding[];
  selectedFinding: Finding | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const initialState: FindingsState = {
  items: [],
  selectedFinding: null,
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
export const fetchFindings = createAsyncThunk(
  'findings/fetchAll',
  async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    severity?: string;
    status?: string;
    assetId?: string;
    threatId?: string;
  }) => {
    return findingsService.getAll(params);
  }
);

export const fetchFindingById = createAsyncThunk('findings/fetchById', async (id: string) => {
  return findingsService.getById(id);
});

export const createFinding = createAsyncThunk('findings/create', async (data: Partial<Finding>) => {
  return findingsService.create(data);
});

export const updateFinding = createAsyncThunk(
  'findings/update',
  async ({ id, data }: { id: string; data: Partial<Finding> }) => {
    return findingsService.update(id, data);
  }
);

export const deleteFinding = createAsyncThunk('findings/delete', async (id: string) => {
  await findingsService.delete(id);
  return id;
});

const findingsSlice = createSlice({
  name: 'findings',
  initialState,
  reducers: {
    setSelectedFinding: (state, action: PayloadAction<Finding | null>) => {
      state.selectedFinding = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchFindings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFindings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchFindings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch findings';
      })
      // Fetch by ID
      .addCase(fetchFindingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFindingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedFinding = action.payload;
      })
      .addCase(fetchFindingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch finding';
      })
      // Create
      .addCase(createFinding.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      })
      // Update
      .addCase(updateFinding.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedFinding?.id === action.payload.id) {
          state.selectedFinding = action.payload;
        }
      })
      // Delete
      .addCase(deleteFinding.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedFinding?.id === action.payload) {
          state.selectedFinding = null;
        }
      });
  },
});

export const { setSelectedFinding, clearError } = findingsSlice.actions;
export default findingsSlice.reducer;



