import ResourceCard from "@/components/resourceCard/ResourceCard";
import { resolveResourceLabel } from "@/helpers/arn.helpers";
import { DASHBOARD_IDS } from "@/pages/dashboard/constants";
import {
  formatTimestamp,
  getTimestampFromArnData,
  inferServiceFromArn,
  resolveWatchedActions,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import type { WatchlistResource } from "@/services/resources.service";
import type {
  ArnPermissionData,
  ResourceStatus,
} from "@/services/types/resources.types";
import Grid from "@mui/material/Grid";
import React from "react";

interface ResourceGridProps {
  resources: WatchlistResource[];
  permissionsMap: Record<string, ArnPermissionData>;
  resourceStatuses: Record<string, ResourceStatus>;
}

const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  permissionsMap,
  resourceStatuses,
}) => (
  <Grid container spacing={2} id={DASHBOARD_IDS.resourceGrid}>
    {resources.map(({ arn, actions, name }) => {
      const arnData = permissionsMap[arn];
      const status = resourceStatuses[arn] ?? "unscanned";

      return (
        <Grid key={arn} size={{ xs: 12, md: 6, lg: 4 }}>
          <ResourceCard
            service={inferServiceFromArn(arn)}
            title={resolveResourceLabel(arn, name)}
            arn={arn}
            lastUpdated={formatTimestamp(arnData ? getTimestampFromArnData(arnData) : "")}
            status={status}
            actions={resolveWatchedActions(actions, arnData)}
          />
        </Grid>
      );
    })}

  </Grid>
);

export default ResourceGrid;
