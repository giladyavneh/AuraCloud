import { alpha, styled } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { USER_LIST_MAX_HEIGHT } from "@/constants";

export const UserList = styled(List)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  maxHeight: USER_LIST_MAX_HEIGHT,
  overflowY: "auto",
  padding: 0,
}));

export const UserItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.12) : "transparent",
  "&:last-child": { borderBottom: "none" },
  "&:hover": {
    backgroundColor: isSelected
      ? alpha(theme.palette.primary.main, 0.18)
      : theme.palette.action.hover,
  },
}));
