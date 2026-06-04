import { SquaresFourIcon, EyeIcon } from '@phosphor-icons/react';
import type { ComponentType } from 'react';

export interface NavItem {
  labelKey: string;
  path: string;
  icon: ComponentType<{ size?: number }>;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: SquaresFourIcon },
  { labelKey: 'nav.resourceWatchList', path: '/resource-watch-list', icon: EyeIcon },
];
