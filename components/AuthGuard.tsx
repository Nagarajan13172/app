'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  logout,
  selectIsAuthenticated,
  selectIsInitialized,
} from '@/lib/features/auth/authSlice';

// Client-side guard for protected route groups. Waits for auth rehydration,
// then redirects unauthenticated users to /login.
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectIsInitialized);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      // We only reach here if the proxy let us through (a token cookie exists)
      // but the client has no valid session — clear the stale cookie so the
      // proxy doesn't bounce us straight back, then go to /login.
      dispatch(logout());
      router.replace('/login');
    }
  }, [isInitialized, isAuthenticated, dispatch, router]);

  // Show a loader until we've rehydrated and confirmed authentication
  // (also covers the brief moment before the redirect above fires).
  if (!isInitialized || !isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
