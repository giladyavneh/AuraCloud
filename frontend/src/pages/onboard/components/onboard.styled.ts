import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { alpha, styled } from "@mui/material/styles";

export const OnboardRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: theme.palette.surface.canvas,
  padding: theme.spacing(4),
  position: "relative",
  overflow: "hidden",
}));

export const OnboardStack = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
  width: "100%",
  maxWidth: 560,
  position: "relative",
  zIndex: 1,
}));

export const SecondaryCard = styled(Card)(({ theme }) => ({
  width: "100%",
  backgroundColor: alpha(theme.palette.surface.base, 0.35),
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: `1px solid ${alpha(theme.palette.border.strong, 0.3)}`,
  padding: theme.spacing(1.5, 3),
}));

// Full-bleed wrapper for the WebGL Pixel Blast background.
// Pointer events stay enabled so click-ripples on the canvas still fire;
// the OnboardCard sits above at zIndex 1, so form clicks aren't affected.
export const BackgroundLayer = styled(Box)({
  position: "absolute",
  inset: 0,
  zIndex: 0,
});

export const OnboardCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 560,
  // Frosted glass: semi-transparent surface + backdrop blur lets the pixel grid bleed through
  backgroundColor: alpha(theme.palette.surface.base, 0.5),
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: `1px solid ${alpha(theme.palette.border.strong, 0.5)}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  padding: theme.spacing(5),
}));

export const HeaderBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: theme.spacing(2),
}));

export const LogoBadge = styled(Box)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: (theme.shape.borderRadius as number) + 4,
  backgroundColor: theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.background.default,
  marginBottom: theme.spacing(1),
}));

export const StepBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const StepHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const StepNumber = styled(Box)(({ theme }) => ({
  width: 28,
  height: 28,
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.surface.canvas,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  ...theme.typography.caption,
  fontWeight: 600,
}));

export const OnboardForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const Divider = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: alpha(theme.palette.border.default, 0.6),
}));
