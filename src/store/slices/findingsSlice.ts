// Findings Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Finding } from '@/types';

interface FindingsState {
  items: Finding[];
  selectedFinding: Finding | null;
  loading: boolean;
  error: string | null;
}

const initialState: FindingsState = {
  items: [],
  selectedFinding: null,
  loading: false,
  error: null,
};

// Placeholder - will be implemented with actual service
export const fetchFindings = createAsyncThunk('findings/fetchAll', async () => {
  // TODO: Implement with findings service
  return [] as Finding[];
});

const findingsSlice = createSlice({
  name: 'findings',
  initialState,
  reducers: {
    setSelectedFinding: (state, action: PayloadAction<Finding | null>) => {
      state.selectedFinding = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFindings.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export const { setSelectedFinding } = findingsSlice.actions;
export default findingsSlice.reducer;

