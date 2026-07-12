'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector } from '@/lib/hooks';
import {
  selectIsAuthenticated,
  selectIsInitialized,
} from '@/lib/features/auth/authSlice';

// The root path is normally redirected by proxy.ts based on the auth cookie;
// this is the client-side fallback that routes once auth has rehydrated.
export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectIsInitialized);

  useEffect(() => {
    if (isInitialized) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}
