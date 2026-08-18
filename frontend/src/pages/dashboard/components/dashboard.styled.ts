import { MONO_LABEL_FONT_SIZE } from "@/constants";
import { spotlightOverlayStyles } from "@/components/spotlightCard/components/spotlightCard.styled";
import { getTagStyles } from "@/components/statusTag/helpers/statusTag.helpers";
import type { StatusTagVariant } from "@/components/statusTag/types/statusTag.types";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";

export const PageRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(6),
}));

export const StatusSummaryRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(4, 6),
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  ...spotlightOverlayStyles(theme),
}));

// Above the aurora (0), scrim (1) and spotlight (2).
export const StatusSummaryLeft = styled(Box)(({ theme }) => ({
  position: "relative",
  zIndex: 3,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const StatusSummaryRight = styled(Box)(({ theme }) => ({
  position: "relative",
  zIndex: 3,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: theme.spacing(3),
  flexShrink: 0,
}));

export const StatsRowContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
}));

/** Row containing the section title/description (left) and filter tabs (right) */
export const ResourceSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(4),
}));

/** Pill container that wraps all filter tab buttons */
export const FilterTabsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5),
  flexShrink: 0,
}));

/** Small count badge rendered inside a FilterTab */
export const FilterTabCount = styled("span", {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  marginLeft: theme.spacing(1),
  fontSize: MONO_LABEL_FONT_SIZE,
  fontFamily: theme.typography.fontFamily,
  opacity: isActive ? 0.75 : 0.5,
}));

/** Full-width empty-state card shown when the watchlist has no resources */
export const EmptyStateCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: theme.spacing(4),
  padding: theme.spacing(10, 6),
  backgroundColor: "transparent",
  border: `1px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: "none",
}));

/** Individual filter tab — active state gets a solid primary fill */
export const FilterTab = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  padding: theme.spacing(1.5, 3),
  // Inset radius so the active fill sits concentrically inside the parent pill
  borderRadius: `calc(${theme.shape.borderRadius}px - ${theme.spacing(0.5)})`,
  cursor: "pointer",
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 400,
  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: isActive ? theme.palette.surface.glow : "transparent",
  boxShadow: isActive ? `inset 0 0 0 1px ${theme.palette.border.glow}` : "none",
  transition:
    "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
  userSelect: "none",
  whiteSpace: "nowrap",
  outline: "none",

  "&:hover": {
    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
    backgroundColor: isActive
      ? theme.palette.surface.glow
      : theme.palette.divider,
  },

  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));

export const HeadingCount = styled("span", {
  shouldForwardProp: (prop) => prop !== "statusVariant",
})<{ statusVariant: StatusTagVariant }>(({ theme, statusVariant }) => ({
  color: getTagStyles(theme.palette, statusVariant).color,
}));
