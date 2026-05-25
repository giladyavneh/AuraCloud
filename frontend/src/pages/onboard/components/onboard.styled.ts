import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";

export const OnboardRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: theme.palette.surface.canvas,
  padding: theme.spacing(4),
}));

export const OnboardCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 560,
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  padding: theme.spacing(5),
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
  gap: theme.spacing(2),
}));

export const Divider = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: theme.palette.border.default,
}));
