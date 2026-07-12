import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setCredentials, logout } from './authSlice';
import { persistAuth, clearAuth } from '@/lib/auth/token';

// Keeps localStorage + the auth cookie in sync with the store as a side effect,
// which lets the reducers stay pure.
export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (action) => {
    persistAuth(action.payload.accessToken, action.payload.user);
  },
});

authListenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    clearAuth();
  },
});
