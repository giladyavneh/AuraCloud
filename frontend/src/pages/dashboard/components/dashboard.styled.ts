import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

const PILL_RADIUS = 99;

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
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

export const StatusSummaryLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const StatusSummaryRight = styled(Box)(({ theme }) => ({
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
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: PILL_RADIUS,
  padding: theme.spacing(0.5),
  flexShrink: 0,
}));

/** Small count badge rendered inside a FilterTab */
export const FilterTabCount = styled("span", {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  marginLeft: theme.spacing(1),
  fontSize: "11px",
  fontFamily: theme.typography.fontFamilyMono,
  opacity: isActive ? 0.75 : 0.5,
}));

/** Individual filter tab — active state gets a solid primary fill */
export const FilterTab = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  padding: theme.spacing(1.5, 3),
  borderRadius: PILL_RADIUS,
  cursor: "pointer",
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 400,
  color: isActive ? theme.palette.background.default : theme.palette.text.secondary,
  backgroundColor: isActive ? theme.palette.primary.main : "transparent",
  transition: "background-color 0.15s ease, color 0.15s ease",
  userSelect: "none",
  whiteSpace: "nowrap",
  outline: "none",

  "&:hover": {
    color: isActive ? theme.palette.background.default : theme.palette.text.primary,
    backgroundColor: isActive ? theme.palette.primary.main : theme.palette.divider,
  },

  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));
