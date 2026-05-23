import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    surface: {
      subtle: string;
      glow: string;
    };
    border: {
      strong: string;
      glow: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      subtle?: string;
      glow?: string;
    };
    border?: {
      strong?: string;
      glow?: string;
    };
  }
}
