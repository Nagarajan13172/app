'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
} from '@mui/material';
import { EmailOutlined } from '@mui/icons-material';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import { useLoginMutation } from '@/lib/api/authApi';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  setCredentials,
  selectIsAuthenticated,
  selectIsInitialized,
} from '@/lib/features/auth/authSlice';
import { getErrorMessage } from '@/lib/api/parseError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only accept a same-origin absolute path (e.g. "/dashboard"). Rejects
// protocol-relative ("//host") and backslash tricks to prevent open redirects.
const safeRedirect = (raw: string | null): string =>
  raw && /^\/[^/\\]/.test(raw) ? raw : '/dashboard';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const isInitialized = useAppSelector(selectIsInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Forward already-authenticated users away from the sign-in form (covers the
  // case where the optimistic cookie is gone but a valid session was rehydrated
  // from localStorage).
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(
        safeRedirect(new URLSearchParams(window.location.search).get('from')),
      );
    }
  }, [isInitialized, isAuthenticated, router]);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address';
    // The backend LoginDto only requires a non-empty password, so don't impose
    // the register-only 6-char minimum here.
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const data = await login({ email, password }).unwrap();
      dispatch(setCredentials(data));
      const from = new URLSearchParams(window.location.search).get('from');
      router.replace(safeRedirect(from));
    } catch {
      /* error is surfaced via `error` from the mutation */
    }
  };

  // Brief loader while the redirect effect above navigates an authed user away.
  if (isInitialized && isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account to continue."
      footer={
        <span>
          Don&apos;t have an account?{' '}
          <MuiLink component={Link} href="/register" sx={{ fontWeight: 600 }}>
            Create one
          </MuiLink>
        </span>
      }
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            autoFocus
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <PasswordField
            label="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>
      </Box>
    </AuthShell>
  );
}
