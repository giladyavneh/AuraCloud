import type { FilterTabValue } from "@/pages/dashboard/types/dashboard.types";

export const EMPTY_STATE_ICON_SIZE = 48;

export const FILTER_TABS: FilterTabValue[] = ["all", "iam", "resource", "network", "healthy"];

/** Stable hooks for debugging and tests. */
export const DASHBOARD_IDS = {
  page: "dashboard-page",
  statusSummary: "dashboard-status-summary",
  statsRow: "dashboard-stats-row",
  resourceSection: "dashboard-resource-section",
  resourceSectionHeader: "dashboard-resource-section-header",
  filterTabs: "dashboard-filter-tabs",
  resourceScroll: "dashboard-resource-scroll",
  resourceGrid: "dashboard-resource-grid",
  emptyState: "dashboard-empty-state",
  loading: "dashboard-loading",
  error: "dashboard-error",
  noFilterMatches: "dashboard-no-filter-matches",
} as const;
