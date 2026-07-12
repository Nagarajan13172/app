'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout, selectCurrentUser } from '@/lib/features/auth/authSlice';

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Products', href: '/products' },
];

// Shared chrome for every authenticated page: top nav + user menu.
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="default"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, mr: { xs: 1, sm: 4 } }}
          >
            ◆ Nest App
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  color={active ? 'primary' : 'inherit'}
                  sx={{ fontWeight: active ? 700 : 500 }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {user?.role && (
              <Chip
                label={user.role}
                size="small"
                color={user.role === 'admin' ? 'secondary' : 'default'}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              />
            )}
            <Avatar
              sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 15 }}
            >
              {initials}
            </Avatar>
            <Button
              color="inherit"
              startIcon={<LogoutOutlined />}
              onClick={handleLogout}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Log out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="main">{children}</Box>
    </Box>
  );
}
