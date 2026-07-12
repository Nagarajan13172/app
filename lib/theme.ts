'use client';

import { createTheme } from '@mui/material/styles';

// App-wide Material UI theme. Uses the Geist font already loaded in the root
// layout via next/font (exposed as the --font-geist-sans CSS variable).
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5' },
    secondary: { main: '#0ea5e9' },
    background: { default: '#f4f5fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingBlock: 10 } },
    },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
