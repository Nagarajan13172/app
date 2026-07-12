'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { Inventory2Outlined } from '@mui/icons-material';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/auth/authSlice';
import { useGetProfileQuery } from '@/lib/api/authApi';

export default function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  // Demonstrates a protected endpoint fetched through Redux Toolkit Query.
  const { data: profile, isLoading } = useGetProfileQuery();

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h4">
              Welcome, {user?.firstName ?? 'there'} 👋
            </Typography>
            <Typography color="text.secondary">
              You are signed in to a protected route.
            </Typography>
          </Box>
        </Stack>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Your profile
            </Typography>
            {isLoading ? (
              <Box sx={{ py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Row label="Name" value={fullName || '—'} />
                <Row label="Email" value={user?.email ?? profile?.email ?? '—'} />
                <Row label="Phone" value={user?.phone || '—'} />
                <Row
                  label="Role"
                  valueNode={
                    <Chip
                      label={profile?.role ?? user?.role ?? 'user'}
                      size="small"
                      color="primary"
                    />
                  }
                />
                <Row label="User ID" value={user?.id ?? profile?.userId ?? '—'} />
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography variant="h6">Product catalog</Typography>
                <Typography color="text.secondary" variant="body2">
                  Browse products, or manage them if you&apos;re an admin.
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/products"
                variant="contained"
                startIcon={<Inventory2Outlined />}
              >
                Open products
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary">
          This profile was fetched from{' '}
          <Box component="code" sx={{ fontFamily: 'monospace' }}>
            GET /api/auth/profile
          </Box>{' '}
          through Redux Toolkit Query, using the Bearer token saved after
          sign-in.
        </Typography>
      </Stack>
    </Container>
  );
}

function Row({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Typography color="text.secondary">{label}</Typography>
      {valueNode ?? <Typography sx={{ fontWeight: 600 }}>{value}</Typography>}
    </Stack>
  );
}
