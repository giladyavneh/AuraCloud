export type MenuItemState = 'active' | 'default';

export interface MenuItemProps {
  label: string;
  state?: MenuItemState;
  onClick?: () => void;
}
