import Box from "@mui/material/Box";
import { alpha, styled } from "@mui/material/styles";

// Absolute layer that holds the Aurora WebGL canvas. Pinned to the card edges
// so it always fills, regardless of content height.
export const AuroraLayer = styled(Box)({
  position: "absolute",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
});

// Soft dark scrim over the aurora so the body text stays readable.
// Stronger at the bottom (where the aurora "ground" sits), lighter at the top.
export const Scrim = styled(Box)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  zIndex: 1,
  pointerEvents: "none",
  background: `linear-gradient(180deg, ${alpha(theme.palette.surface.canvas, 0.2)} 0%, ${alpha(theme.palette.surface.canvas, 0.65)} 100%)`,
}));

// Foreground row: icon + text. Sits above the aurora + scrim.
export const ContentRow = styled(Box)(({ theme }) => ({
  position: "relative",
  zIndex: 3,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
}));

export const TextContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));
