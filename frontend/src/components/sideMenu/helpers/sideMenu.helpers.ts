import { SquaresFourIcon, EyeIcon, UsersIcon } from '@phosphor-icons/react';
import type { ComponentType } from 'react';

export interface NavItem {
  labelKey: string;
  path: string;
  icon: ComponentType<{ size?: number }>;
  /** Hidden from the nav for non-managers. The route itself must still guard access — see Team.tsx. */
  managerOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: SquaresFourIcon },
  { labelKey: 'nav.resourceWatchList', path: '/resource-watch-list', icon: EyeIcon },
  { labelKey: 'nav.team', path: '/team', icon: UsersIcon, managerOnly: true },
];
