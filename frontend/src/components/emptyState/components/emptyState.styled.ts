import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";

export const EmptyStateRoot = styled(Card)(({ theme }) => ({
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
