import { createTheme } from '@mui/material/styles';

/**
 * MUI theme built from Figma design tokens.
 * All color, typography, and spacing values are sourced directly from the Figma variable definitions.
 *
 * Spacing unit: 4px  →  theme.spacing(1) = 4px, theme.spacing(4) = 16px, theme.spacing(6) = 24px
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
      main: '#34d399',         // color/text/success
      dark: '#052e2b',         // color/surface/success
      contrastText: '#065f46', // color/border/success
    },

    error: {
      main: '#f87171',         // color/text/error
      dark: '#3c0707',         // color/surface/error
      contrastText: '#b91c1c', // color/border/error
    },

    warning: {
      main: '#fbbf24',         // color/text/warning
      dark: '#2d1c00',         // color/surface/warning
      contrastText: '#92400e', // color/border/warning
    },

    divider: '#1f2937', // color/border/default  /  color/surface/selected

    // Custom Figma tokens not covered by standard MUI palette slots
    surface: {
      subtle: '#0f172a', // color/surface/subtle  (sidebar background)
      glow: 'rgba(223,181,253,0.2)', // color/surface/glow
    },

    border: {
      strong: '#334155', // color/border/strong
      glow: 'rgba(255,255,255,0.2)', // color/border/glow
    },
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

  // Base unit: 4px  →  spacing(n) = n * 4px
  spacing: 4,

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
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
        },
      },
    },
  },
});

export default theme;
