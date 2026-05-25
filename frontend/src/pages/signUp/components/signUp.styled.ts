import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";

export const SignUpRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: theme.palette.surface.canvas,
}));

export const SignUpCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 480,
  padding: theme.spacing(5),
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const SignUpForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const NameRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));
