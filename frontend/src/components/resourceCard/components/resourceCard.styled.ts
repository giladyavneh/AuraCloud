import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

export const CardRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "stretch",
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

export const CardBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  padding: theme.spacing(4),
}));

export const CardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "start",
  gap: theme.spacing(3),
}));

export const ServiceMeta = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  flex: 1,
  minWidth: 0,
}));

export const MetaTopRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

export const ResourceList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const ResourceItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const ResourceDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "dotColor",
})<{ dotColor: string }>(({ dotColor }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: dotColor,
  flexShrink: 0,
}));

export const MoreActionsPopoverContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(4),
  minWidth: 200,
  maxWidth: 320,
}));
