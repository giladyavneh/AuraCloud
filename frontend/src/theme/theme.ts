import { createTheme } from '@mui/material/styles';

/**
 * MUI theme built from Figma design tokens.
 * All color, typography, and spacing values are sourced directly from the Figma variable definitions.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0f19', // color/surface/canvas
      paper: '#111827',   // color/surface/base
    },
    primary: {
      main: '#dfb5fd',    // color/brand/accent
    },
    text: {
      primary: '#f8fafc',   // color/text/primary
      secondary: '#cbd5e1', // color/text/secondary
      disabled: '#94a3b8',  // color/text/tertiary
    },
    success: {
      main: '#34d399',      // color/status/success
      dark: '#052e2b',      // color/surface/success
      contrastText: '#065f46', // color/border/success
    },
    error: {
      main: '#f87171',      // color/status/error
      dark: '#3c0707',      // color/surface/error
      contrastText: '#b91c1c', // color/border/error
    },
    warning: {
      main: '#fbbf24',      // color/text/warning / color/warning/400
      dark: '#b45309',      // color/warning/700
    },
    divider: '#1f2937',     // color/border/default
  },

  typography: {
    fontFamily: '"Rubik", sans-serif',
    h4: {
      fontSize: '34px',
      fontWeight: 400,
      lineHeight: '40px',
      letterSpacing: '0.25px',
    },
    h5: {
      fontSize: '23px',
      fontWeight: 400,
      lineHeight: '32px',
    },
    subtitle1: {
      fontSize: '15px',
      fontWeight: 500,
      lineHeight: '28px',
    },
    subtitle2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '22px',
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1,
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '20px',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: 1,
    },
  },

  spacing: [0, 4, 8, 16, 24], // None, Condensed, Regular, Large, XL

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b0f19',
          margin: 0,
          padding: 0,
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"Rubik", sans-serif',
        },
      },
    },
  },
});

export default theme;
