import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser, AuthData } from '@/lib/types/api';
import type { RootState } from '@/lib/store';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  // Becomes true once we've attempted to read persisted auth on the client.
  // Guards against redirecting before rehydration has run.
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set after a successful login/register. A listener persists this to storage.
    setCredentials: (state, action: PayloadAction<AuthData>) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    // Rehydrate from persisted storage on app start (client only).
    hydrate: (
      state,
      action: PayloadAction<{ token: string | null; user: AuthUser | null }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = Boolean(action.payload.token);
      state.isInitialized = true;
    },
    // Clear the session. A listener wipes storage + cookie.
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, hydrate, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectAuth = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsInitialized = (state: RootState) => state.auth.isInitialized;
