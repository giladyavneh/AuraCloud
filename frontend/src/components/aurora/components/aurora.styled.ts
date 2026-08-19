import Box from "@mui/material/Box";
import { alpha, styled } from "@mui/material/styles";

export const AuroraContainer = styled(Box)({
  width: "100%",
  height: "100%",
});

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
