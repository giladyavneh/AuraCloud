import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";

export const LoginRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: theme.palette.surface.canvas,
}));

export const LoginCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 440,
  padding: theme.spacing(5),
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const LoginForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));
