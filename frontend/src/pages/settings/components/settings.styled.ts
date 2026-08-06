import {
  SETTINGS_COLUMN_MAX_WIDTH,
  SETTINGS_TWO_COLUMN_MAX_WIDTH,
} from "@/pages/settings/constants";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";

export const SettingsRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

/**
 * Personal settings beside company ones. An employee has no company column, so the grid
 * collapses to the single-column width rather than leaving a half-width page.
 */
export const SettingsColumns = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasCompanyColumn",
})<{ hasCompanyColumn: boolean }>(({ theme, hasCompanyColumn }) => ({
  display: "grid",
  gridTemplateColumns: hasCompanyColumn ? "1fr 1fr" : "1fr",
  alignItems: "start",
  gap: theme.spacing(4),
  maxWidth: hasCompanyColumn ? SETTINGS_TWO_COLUMN_MAX_WIDTH : SETTINGS_COLUMN_MAX_WIDTH,

  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr",
    maxWidth: SETTINGS_COLUMN_MAX_WIDTH,
  },
}));

export const SettingsColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
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
