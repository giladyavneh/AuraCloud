import React from "react";
import { useTheme } from "@mui/material/styles";
import {
  ItemRoot,
  ActiveIndicator,
  ItemLabel,
} from "@/components/menuItem/components/menuItem.styled";
import type { MenuItemProps } from "@/components/menuItem/types/menuItem.types";

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  icon: Icon,
  state = "default",
  onClick,
}) => {
  const isActive = state === "active";
  const theme = useTheme();

  return (
    <ItemRoot isActive={isActive} onClick={onClick} role="button" tabIndex={0}>
      <ActiveIndicator isActive={isActive} />

      {Icon && (
        <Icon
          size={theme.iconSize.sm}
          color={
            isActive ? theme.palette.text.primary : theme.palette.text.secondary
          }
        />
      )}

      <ItemLabel isActive={isActive}>{label}</ItemLabel>
    </ItemRoot>
  );
};

export default MenuItem;
