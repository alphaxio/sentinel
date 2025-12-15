// Assets Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { assetsService } from '@/services/assets.service';
import type { Asset, PaginatedResponse } from '@/types';

interface AssetsState {
  items: Asset[];
  selectedAsset: Asset | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const initialState: AssetsState = {
  items: [],
  selectedAsset: null,
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
export const fetchAssets = createAsyncThunk(
  'assets/fetchAll',
  async (params?: { page?: number; pageSize?: number; search?: string }) => {
    return assetsService.getAll(params);
  }
);

export const fetchAssetById = createAsyncThunk('assets/fetchById', async (id: string) => {
  return assetsService.getById(id);
});

export const createAsset = createAsyncThunk('assets/create', async (data: Partial<Asset>) => {
  return assetsService.create(data);
});

export const updateAsset = createAsyncThunk(
  'assets/update',
  async ({ id, data }: { id: string; data: Partial<Asset> }) => {
    return assetsService.update(id, data);
  }
);

export const deleteAsset = createAsyncThunk('assets/delete', async (id: string) => {
  await assetsService.delete(id);
  return id;
});

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setSelectedAsset: (state, action: PayloadAction<Asset | null>) => {
      state.selectedAsset = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch assets';
      })
      // Fetch by ID
      .addCase(fetchAssetById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAsset = action.payload;
      })
      .addCase(fetchAssetById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch asset';
      })
      // Create
      .addCase(createAsset.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      })
      // Update
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedAsset?.id === action.payload.id) {
          state.selectedAsset = action.payload;
        }
      })
      // Delete
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedAsset?.id === action.payload) {
          state.selectedAsset = null;
        }
      });
  },
});

export const { setSelectedAsset, clearError } = assetsSlice.actions;
export default assetsSlice.reducer;

