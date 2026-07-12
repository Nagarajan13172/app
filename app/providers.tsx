'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { setupListeners } from '@reduxjs/toolkit/query';
import { makeStore, type AppStore } from '@/lib/store';
import { theme } from '@/lib/theme';
import { hydrate } from '@/lib/features/auth/authSlice';
import {
  readStoredToken,
  readStoredUser,
  refreshAuthCookie,
} from '@/lib/auth/token';

// Single client boundary for the whole app: Redux store + MUI theme.
// Rendered inside the Server Component root layout, wrapping only {children}.
export default function Providers({ children }: { children: ReactNode }) {
  // One store instance per browser session (created lazily, never on the server
  // more than once per request).
  const storeRef = useRef<AppStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const store = storeRef.current!;
    // Enable refetchOnFocus / refetchOnReconnect behaviour.
    const unsubscribe = setupListeners(store.dispatch);
    // Rehydrate auth from localStorage (or the cookie fallback) now that we're
    // on the client, and re-align the cookie so it can't expire out from under
    // a still-valid localStorage token.
    const token = readStoredToken();
    store.dispatch(hydrate({ token, user: readStoredUser() }));
    if (token) refreshAuthCookie(token);
    return unsubscribe;
  }, []);

  return (
    <Provider store={storeRef.current}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Provider>
  );
}
