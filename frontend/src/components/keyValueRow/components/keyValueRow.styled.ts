import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

export const KeyValueRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  paddingBlock: theme.spacing(1.5),
  paddingInline: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.surface.subtle,
  border: `1px solid ${theme.palette.border.default}`,
}));
