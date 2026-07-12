'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
import {
  EmailOutlined,
  PersonOutlined,
  PhoneOutlined,
} from '@mui/icons-material';
import AuthShell from '@/components/auth/AuthShell';
import PasswordField from '@/components/auth/PasswordField';
import { useRegisterMutation } from '@/lib/api/authApi';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  setCredentials,
  selectIsAuthenticated,
  selectIsInitialized,
} from '@/lib/features/auth/authSlice';
import { getErrorMessage } from '@/lib/api/parseError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading, error }] = useRegisterMutation();
  const isInitialized = useAppSelector(selectIsInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Forward already-authenticated users straight to the app.
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isInitialized, isAuthenticated, router]);

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const update =
    (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    else if (form.firstName.length > 50)
      errs.firstName = 'First name is too long';
    if (form.lastName.length > 50) errs.lastName = 'Last name is too long';
    if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address';
    if (form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    else if (form.password.length > 64)
      errs.password = 'Password must be at most 64 characters';
    if (form.phone.length > 20) errs.phone = 'Phone number is too long';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const data = await register({
        firstName: form.firstName.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.lastName.trim() ? { lastName: form.lastName.trim() } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      }).unwrap();
      dispatch(setCredentials(data));
      router.replace('/dashboard');
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
      title="Create your account"
      subtitle="Join in less than a minute."
      footer={
        <span>
          Already have an account?{' '}
          <MuiLink component={Link} href="/login" sx={{ fontWeight: 600 }}>
            Sign in
          </MuiLink>
        </span>
      }
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="First name"
              value={form.firstName}
              autoFocus
              onChange={update('firstName')}
              error={Boolean(fieldErrors.firstName)}
              helperText={fieldErrors.firstName}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Last name (optional)"
              value={form.lastName}
              onChange={update('lastName')}
              error={Boolean(fieldErrors.lastName)}
              helperText={fieldErrors.lastName}
            />
          </Stack>
          <TextField
            label="Email"
            type="email"
            value={form.email}
            autoComplete="email"
            onChange={update('email')}
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
          <TextField
            label="Phone (optional)"
            value={form.phone}
            autoComplete="tel"
            onChange={update('phone')}
            error={Boolean(fieldErrors.phone)}
            helperText={fieldErrors.phone}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlined fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <PasswordField
            label="Password"
            value={form.password}
            autoComplete="new-password"
            onChange={update('password')}
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password || 'At least 6 characters'}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
        </Stack>
      </Box>
    </AuthShell>
  );
}
