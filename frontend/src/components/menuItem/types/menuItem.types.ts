import type { ComponentType } from 'react';

export type MenuItemState = 'active' | 'default';

export interface MenuItemProps {
  label: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  state?: MenuItemState;
  onClick?: () => void;
}
