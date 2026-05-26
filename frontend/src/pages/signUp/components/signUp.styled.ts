import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { Link as RouterLink } from "react-router-dom";
import { alpha, styled } from "@mui/material/styles";

export const SignUpRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: theme.palette.surface.canvas,
  padding: theme.spacing(4),
  position: "relative",
  overflow: "hidden",
}));

// Full-bleed wrapper for the WebGL Pixel Blast background.
// Pointer events stay enabled so click-ripples on the canvas still fire;
// the SignUpCard sits above at zIndex 1, so form clicks aren't affected.
export const BackgroundLayer = styled(Box)({
  position: "absolute",
  inset: 0,
  zIndex: 0,
});

export const SignUpCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 480,
  padding: theme.spacing(5),
  // Frosted glass: semi-transparent surface + backdrop blur lets the pixel grid bleed through
  backgroundColor: alpha(theme.palette.surface.base, 0.5),
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: `1px solid ${alpha(theme.palette.border.strong, 0.5)}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  position: "relative",
  zIndex: 1,
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

export const SignUpForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const NameRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const FooterLink = styled(RouterLink)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: "none",
  fontWeight: 500,

  "&:hover": {
    textDecoration: "underline",
  },
}));
