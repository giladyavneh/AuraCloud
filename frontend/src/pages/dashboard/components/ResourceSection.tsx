import { useUserPermissions, useUserResourceWatchlist } from "@/hooks/resources.hooks";
import DashboardEmptyState from "@/pages/dashboard/components/DashboardEmptyState";
import ResourceFilterTabs from "@/pages/dashboard/components/ResourceFilterTabs";
import ResourceGrid from "@/pages/dashboard/components/ResourceGrid";
import {
  ResourceScrollArea,
  ResourceSectionHeader,
  ResourceSectionRoot,
} from "@/pages/dashboard/components/dashboard.styled";
import { DASHBOARD_IDS } from "@/pages/dashboard/constants";
import {
  countFilterTabs,
  filterResourcesByTab,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import type { FilterTabValue } from "@/pages/dashboard/types/dashboard.types";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const ResourceSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterTabValue>("all");

  const { data: watchlistItems = [], isLoading: isWatchlistLoading } = useUserResourceWatchlist();
  const {
    data: permission,
    isLoading: isPermissionsLoading,
    isError,
    error: permissionError,
  } = useUserPermissions();

  const watchedResources = useMemo(
    () => watchlistItems[0]?.resources ?? [],
    [watchlistItems],
  );
  const permissionsMap = permission?.permissionsData ?? {};
  const resourceStatuses = useMemo(
    () => permission?.resourceStatuses ?? {},
    [permission?.resourceStatuses],
  );

  const isLoading = isWatchlistLoading || isPermissionsLoading;

  // A 404 means nothing is watched yet, which the empty state covers.
  const isRealError = isError && !permissionError?.message.includes("404");

  const tabCounts = useMemo(
    () => countFilterTabs(watchedResources, resourceStatuses),
    [watchedResources, resourceStatuses],
  );
  const filteredResources = filterResourcesByTab(watchedResources, resourceStatuses, activeFilter);

  const hasResources = watchedResources.length > 0;

  return (
    <ResourceSectionRoot id={DASHBOARD_IDS.resourceSection}>
      <ResourceSectionHeader id={DASHBOARD_IDS.resourceSectionHeader}>
        <Box>
          <Typography variant="h5" color="textPrimary">
            {t("dashboard.resourceStatus")}
          </Typography>

          <Typography variant="body2" color="textDisabled">
            {t("dashboard.resourceStatusDescription")}
          </Typography>

        </Box>

        <ResourceFilterTabs
          activeFilter={activeFilter}
          tabCounts={tabCounts}
          showCounts={hasResources}
          onFilterChange={setActiveFilter}
        />

      </ResourceSectionHeader>

      <ResourceScrollArea id={DASHBOARD_IDS.resourceScroll}>
        {isLoading && (
          <Box
            id={DASHBOARD_IDS.loading}
            sx={{ display: "flex", justifyContent: "center", paddingBlock: 4 }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}

        {!isLoading && isRealError && (
          <Typography id={DASHBOARD_IDS.error} variant="body2" color="error">
            {t("dashboard.permissionsLoadError")}
          </Typography>
        )}

        {!isLoading && !isRealError && !hasResources && <DashboardEmptyState />}

        {!isLoading && !isRealError && hasResources && filteredResources.length === 0 && (
          <Typography id={DASHBOARD_IDS.noFilterMatches} variant="body2" color="textSecondary">
            {t("dashboard.noResourcesForFilter")}
          </Typography>
        )}

        {!isLoading && !isRealError && filteredResources.length > 0 && (
          <ResourceGrid
            resources={filteredResources}
            permissionsMap={permissionsMap}
            resourceStatuses={resourceStatuses}
          />
        )}

      </ResourceScrollArea>

    </ResourceSectionRoot>
  );
};

export default ResourceSection;
