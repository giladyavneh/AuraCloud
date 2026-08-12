import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

export const ClientList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

/** minWidth 0 so a long address wraps instead of pushing Disconnect off the row. */
export const ClientRowDetails = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  flexGrow: 1,
  minWidth: 0,
}));
