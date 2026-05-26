import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    fontFamilyMono: string;
  }
  interface TypographyVariantsOptions {
    fontFamilyMono?: string;
  }

  interface Palette {
    surface: {
      canvas: string;
      base: string;
      subtle: string;
      glow: string;
    };
    border: {
      default: string;
      strong: string;
      glow: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      canvas?: string;
      base?: string;
      subtle?: string;
      glow?: string;
    };
    border?: {
      default?: string;
      strong?: string;
      glow?: string;
    };
  }

  interface Theme {
    iconSize: {
      xs: number; // 16 — button / inline icons
      sm: number; // 20 — footer nav icons
      md: number; // 28 — logo
      lg: number; // 32 — feature icons, table AWS icons
      xl: number; // 46 — resource card AWS icon
    };
  }

  interface ThemeOptions {
    iconSize?: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };
  }
}
