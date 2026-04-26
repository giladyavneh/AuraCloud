import React from 'react';
import { ItemRoot, ActiveIndicator, ItemLabel } from '@/components/menuItem/menuItem.styled';
import type { MenuItemProps } from '@/components/menuItem/types/menuItem.types';

const MenuItem: React.FC<MenuItemProps> = ({ label, state = 'default', onClick }) => {
  const isActive = state === 'active';

  return (
    <ItemRoot isActive={isActive} onClick={onClick} role="button" tabIndex={0}>
      {isActive && <ActiveIndicator />}
      <ItemLabel isActive={isActive}>{label}</ItemLabel>

    </ItemRoot>
  );
};

export default MenuItem;
