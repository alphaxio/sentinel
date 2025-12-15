// Threats Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Threat } from '@/types';

interface ThreatsState {
  items: Threat[];
  selectedThreat: Threat | null;
  loading: boolean;
  error: string | null;
}

const initialState: ThreatsState = {
  items: [],
  selectedThreat: null,
  loading: false,
  error: null,
};

// Placeholder - will be implemented with actual service
export const fetchThreats = createAsyncThunk('threats/fetchAll', async () => {
  // TODO: Implement with threats service
  return [] as Threat[];
});

const threatsSlice = createSlice({
  name: 'threats',
  initialState,
  reducers: {
    setSelectedThreat: (state, action: PayloadAction<Threat | null>) => {
      state.selectedThreat = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchThreats.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export const { setSelectedThreat } = threatsSlice.actions;
export default threatsSlice.reducer;

