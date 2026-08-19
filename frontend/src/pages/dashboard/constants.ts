import type { FilterTabValue } from "@/pages/dashboard/types/dashboard.types";

export const EMPTY_STATE_ICON_SIZE = 48;

/** Held so a sub-100ms refetch cannot flash the spinner. */
export const REFRESH_SPINNER_MIN_MS = 400;
export const REFRESHED_LABEL_MS = 3_000;
/** Keeps the button from resizing between "Refresh" and "Refreshed". */
export const REFRESH_BUTTON_MIN_WIDTH = 132;

/** Health score percentage at or above which the score reads good, then fair. */
export const HEALTH_SCORE_GOOD = 90;
export const HEALTH_SCORE_FAIR = 60;

/** Severity order — the most urgent filter sits next to the default. */
export const FILTER_TABS: FilterTabValue[] = ["all", "blocked", "stale", "unscanned", "healthy"];

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
