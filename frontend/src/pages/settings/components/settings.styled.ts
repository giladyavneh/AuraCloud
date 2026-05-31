import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";

export const SettingsRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  maxWidth: 640,
}));

export const SettingsHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const SettingsCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  padding: theme.spacing(4),
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const SectionDivider = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: theme.palette.border.default,
}));

export const SettingsForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const FormRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(2),
}));

export const FormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

export const CurrentKeyRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.surface.subtle,
  border: `1px solid ${theme.palette.border.default}`,
}));
