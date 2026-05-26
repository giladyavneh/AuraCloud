import GlowCard from "@/components/glowCard/GlowCard";
import ResourceCard from "@/components/resourceCard/ResourceCard";
import { useUserPermissions, useUserResourceWatchlist } from "@/hooks/resources.hooks";
import {
  deriveStatusFromArnData,
  formatTimestamp,
  getErrorReasonFromArnData,
  getServiceCategory,
  getTimestampFromArnData,
  inferServiceFromArn,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import { extractResourceName } from "@/helpers/arn.helpers";
import type { ArnPermissionData } from "@/services/types/resources.types";
import {
  FilterTab,
  FilterTabsRow,
  ResourceSectionHeader,
} from "@/pages/dashboard/components/dashboard.styled";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type FilterTabValue = "all" | "iam" | "resource" | "network" | "healthy";

const FILTER_TABS: FilterTabValue[] = ["all", "iam", "resource", "network", "healthy"];

const ResourceSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterTabValue>("all");

  const { data: watchlistItems = [], isLoading: watchlistLoading } = useUserResourceWatchlist();
  const { data: permission, isLoading: permissionsLoading, isError, error } = useUserPermissions();

  const watchlistResources = watchlistItems[0]?.resources ?? [];
  const permissionsMap: Record<string, ArnPermissionData> =
    (permission?.permissionsData as Record<string, ArnPermissionData>) ?? {};

  const isLoading = watchlistLoading || permissionsLoading;

  // A 404 just means the Brain hasn't run yet — not a real error
  const isRealError = isError && !error?.message.includes("404");

  const filteredResources = watchlistResources.filter(({ arn }) => {
    if (activeFilter === "all") return true;

    const service = inferServiceFromArn(arn);
    const arnData = permissionsMap[arn];
    const status = arnData ? deriveStatusFromArnData(arnData) : "stale";

    if (activeFilter === "healthy") return status === "healthy";
    return getServiceCategory(service) === activeFilter;
  });

  return (
    <>
      <ResourceSectionHeader>
        <Box>
          <Typography variant="h5" color="textPrimary">
            {t("dashboard.resourceStatus")}
          </Typography>

          <Typography variant="body2" color="textDisabled">
            {t("dashboard.resourceStatusDescription")}
          </Typography>
        </Box>

        <FilterTabsRow>
          {FILTER_TABS.map((tab) => (
            <FilterTab
              key={tab}
              isActive={activeFilter === tab}
              onClick={() => setActiveFilter(tab)}
            >
              {t(`dashboard.filterTabs.${tab}`)}
            </FilterTab>
          ))}
        </FilterTabsRow>
      </ResourceSectionHeader>

      <GlowCard />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", paddingBlock: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {isRealError && (
        <Typography variant="body2" color="error">
          {t("dashboard.permissionsLoadError")}
        </Typography>
      )}

      {!isLoading && !isRealError && watchlistResources.length === 0 && (
        <Typography variant="body2" color="textSecondary">
          {t("dashboard.noResourcesYet")}
        </Typography>
      )}

      {!isLoading && !isRealError && filteredResources.length > 0 && (
        <Grid container spacing={2}>
          {filteredResources.map(({ arn, actions }) => {
            const arnData = permissionsMap[arn];
            const service = inferServiceFromArn(arn);
            const resourceName = extractResourceName(arn);

            // If Brain hasn't analysed this resource yet, show it as stale
            const status = arnData ? deriveStatusFromArnData(arnData) : "stale";
            const errorReason = arnData ? getErrorReasonFromArnData(arnData) : undefined;
            const timestamp = arnData ? getTimestampFromArnData(arnData) : "";

            return (
              <Grid key={arn} size={{ xs: 12, md: 6, lg: 4 }}>
                <ResourceCard
                  service={service}
                  title={resourceName}
                  lastUpdated={formatTimestamp(timestamp)}
                  status={status}
                  actions={actions}
                  errorMessage={status === "blocked" ? errorReason : undefined}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
};

export default ResourceSection;
