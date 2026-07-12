'use client';

import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

// Split-screen auth layout: a branded gradient panel (hidden on mobile) beside a
// centered form card. Shared by the login and register pages.
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {/* Brand panel */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
          p: 8,
          background:
            'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          ◆ Nest App
        </Typography>
        <Box>
          <Typography variant="h3" sx={{ lineHeight: 1.1, mb: 2 }}>
            Build faster.
            <br />
            Ship with confidence.
          </Typography>
          <Typography
            variant="h6"
            sx={{ opacity: 0.85, fontWeight: 400, maxWidth: 440 }}
          >
            Secure authentication, powered by NestJS, Redux Toolkit, and
            Material UI.
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Nest App — protected access
        </Typography>
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h4">{title}</Typography>
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
          {children}
          {footer && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
