import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useTranslation } from "react-i18next";
import GlowCard from "@/components/glowCard/GlowCard";
import ResourceCard from "@/components/resourceCard/ResourceCard";
import { useUserPermissions } from "@/hooks/resources.hooks";
import {
  inferServiceFromArn,
  getActionsFromArnData,
  deriveStatusFromArnData,
  getErrorReasonFromArnData,
  getTimestampFromArnData,
  formatTimestamp,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import { ResourceSectionHeader } from "@/pages/dashboard/components/dashboard.styled";
import { MOCK_USER_ID } from "@/constants";

const ResourceSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    data: permission,
    isLoading,
    isError,
  } = useUserPermissions(MOCK_USER_ID);

  const arnEntries = permission
    ? Object.entries(permission.permissionsData)
    : [];

  return (
    <>
      <ResourceSectionHeader>
        <Typography variant="h5" color="text.primary">
          {t("dashboard.resourceStatus")}
        </Typography>

        <Typography variant="body2" color="text.disabled">
          {t("dashboard.resourceStatusDescription")}
        </Typography>
      </ResourceSectionHeader>

      <GlowCard />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {isError && (
        <Typography variant="body2" color="error.main">
          {t("resourceCard.errorPrefix")} Could not load user permissions.
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
              <Grid key={arn} size={{ xs: 12, md: 6 }}>
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
