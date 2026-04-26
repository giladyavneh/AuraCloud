export interface NavItem {
  labelKey: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard' },
  { labelKey: 'nav.resourceWatchList', path: '/resource-watch-list' },
];
