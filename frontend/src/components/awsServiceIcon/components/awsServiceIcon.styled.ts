import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

export const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "iconSize",
})<{ iconSize: number }>(({ theme, iconSize }) => ({
  width: iconSize,
  height: iconSize,
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: theme.palette.common.white,
  overflow: "hidden",
}));
