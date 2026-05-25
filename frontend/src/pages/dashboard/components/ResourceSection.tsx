import GlowCard from "@/components/glowCard/GlowCard";
import ResourceCard from "@/components/resourceCard/ResourceCard";
import { useUserPermissions } from "@/hooks/resources.hooks";
import {
  deriveStatusFromArnData,
  formatTimestamp,
  getActionsFromArnData,
  getErrorReasonFromArnData,
  getTimestampFromArnData,
  inferServiceFromArn,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import { ResourceSectionHeader } from "@/pages/dashboard/components/dashboard.styled";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTranslation } from "react-i18next";

const ResourceSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: permission, isLoading, isError, error } = useUserPermissions();

  const arnEntries = permission
    ? Object.entries(permission.permissionsData)
    : [];

  // A 404 means the Brain hasn't generated data yet — not a real error
  const isNoData = isError && error?.message.includes("404");
  const isRealError = isError && !isNoData;

  return (
    <>
      <ResourceSectionHeader>
        <Typography variant="h5" color="textPrimary">
          {t("dashboard.resourceStatus")}
        </Typography>

        <Typography variant="body2" color="textDisabled">
          {t("dashboard.resourceStatusDescription")}
        </Typography>
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

      {(isNoData || arnEntries.length === 0) && !isLoading && !isRealError && (
        <Typography variant="body2" color="textSecondary">
          {t("dashboard.noResourcesYet")}
        </Typography>
      )}

      {arnEntries.length > 0 && (
        <Grid container spacing={2}>
          {arnEntries.map(([arn, arnData]) => {
            const service = inferServiceFromArn(arn);
            const resourceName = arn.split(":::")[1] ?? arn;
            const actions = getActionsFromArnData(arnData);
            const status = deriveStatusFromArnData(arnData);
            const errorReason = getErrorReasonFromArnData(arnData);
            const timestamp = getTimestampFromArnData(arnData);

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
