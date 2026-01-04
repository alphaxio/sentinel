// Authentication Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { dispatch }) => {
    // Backend returns: { access_token, token_type }
    const tokenResponse = await apiService.post<{ access_token: string; token_type: string }>(
      API_ENDPOINTS.auth.login,
      credentials
    );
    
    // Store the token
    apiService.setAuthToken(tokenResponse.access_token);
    
    // Fetch user info - backend returns: { user_id, email, full_name, role, permissions }
    const userResponse = await apiService.get<{
      user_id: string;
      email: string;
      full_name: string;
      role: string;
      permissions: string[];
    }>(API_ENDPOINTS.auth.me);
    
    // Map backend response to frontend User type
    const user: User = {
      id: userResponse.user_id,
      email: userResponse.email,
      fullName: userResponse.full_name,
      role: userResponse.role as User['role'],
      permissions: userResponse.permissions
    };
    
    return {
      token: tokenResponse.access_token,
      user: user
    };
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await apiService.post(API_ENDPOINTS.auth.logout);
  } catch (error) {
    // Continue with logout even if API call fails
  }
  apiService.setAuthToken('');
  return null;
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const userResponse = await apiService.get<{
    user_id: string;
    email: string;
    full_name: string;
    role: string;
    permissions: string[];
  }>(API_ENDPOINTS.auth.me);
  
  // Map backend response to frontend User type
  return {
    id: userResponse.user_id,
    email: userResponse.email,
    fullName: userResponse.full_name,
    role: userResponse.role as User['role'],
    permissions: userResponse.permissions
  } as User;
});

export const oauth2Login = createAsyncThunk(
  'auth/oauth2Login',
  async (code: string, { dispatch }) => {
    // Exchange OAuth2 code for token
    const tokenResponse = await apiService.post<{ access_token: string; token_type: string }>(
      API_ENDPOINTS.auth.oauth2Callback,
      { code }
    );
    
    // Store the token
    apiService.setAuthToken(tokenResponse.access_token);
    
    // Fetch user info
    const userResponse = await apiService.get<{
      user_id: string;
      email: string;
      full_name: string;
      role: string;
      permissions: string[];
    }>(API_ENDPOINTS.auth.me);
    
    // Map backend response to frontend User type
    const user: User = {
      id: userResponse.user_id,
      email: userResponse.email,
      fullName: userResponse.full_name,
      role: userResponse.role as User['role'],
      permissions: userResponse.permissions
    };
    
    return {
      token: tokenResponse.access_token,
      user: user
    };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      apiService.setAuthToken(action.payload.token);
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      apiService.setAuthToken('');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      // OAuth2 Login
      .addCase(oauth2Login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(oauth2Login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(oauth2Login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'OAuth2 login failed';
      });
  },
});

export const { setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;



