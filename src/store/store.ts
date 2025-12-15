// Redux Store Configuration

import { configureStore } from '@reduxjs/toolkit';
import assetsSlice from './slices/assetsSlice';
import threatsSlice from './slices/threatsSlice';
import findingsSlice from './slices/findingsSlice';
import authSlice from './slices/authSlice';
import dashboardSlice from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    assets: assetsSlice,
    threats: threatsSlice,
    findings: findingsSlice,
    auth: authSlice,
    dashboard: dashboardSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

