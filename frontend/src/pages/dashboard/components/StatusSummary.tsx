import React from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Trans, useTranslation } from "react-i18next";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserPermissions, useUserResourceWatchlist } from "@/hooks/resources.hooks";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  deriveStatusFromArnData,
  deriveStatusMessage,
  deriveSystemStatus,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import AuroraBackdrop from "@/components/aurora/AuroraBackdrop";
import StatusTag from "@/components/statusTag/StatusTag";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import {
  HeadingCount,
  StatusSummaryLeft,
  StatusSummaryRight,
  StatusSummaryRoot,
} from "@/pages/dashboard/components/dashboard.styled";

const StatusSummary: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: watchlistItems = [], isLoading: isWatchlistLoading } = useUserResourceWatchlist();
  const {
    data: permission,
    isLoading: isPermissionLoading,
    isError: isPermissionError,
    error: permissionError,
  } = useUserPermissions();

  // Cursor-following spotlight, same wiring the dashboard resource cards use.
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPermissions });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResourceWatchlist });
  };

  const monitoredResources = watchlistItems[0]?.resources ?? [];
  const permissionsMap = permission?.permissionsData ?? {};

  const blockedCount = monitoredResources.filter(({ arn }) => {
    const arnData = permissionsMap[arn];
    return arnData ? deriveStatusFromArnData(arnData) === "blocked" : false;
  }).length;

  // Not yet reported on by the Brain counts as stale.
  const staleCount = monitoredResources.filter(({ arn }) => {
    const arnData = permissionsMap[arn];
    return !arnData || deriveStatusFromArnData(arnData) === "stale";
  }).length;

  const statusMessage = deriveStatusMessage({
    isLoading: isWatchlistLoading || isPermissionLoading,
    monitoredCount: monitoredResources.length,
    hasPermissionData: Object.keys(permissionsMap).length > 0,
    blockedCount,
    staleCount,
  });

  const systemStatus = deriveSystemStatus(
    isPermissionLoading,
    isPermissionError,
    permissionError?.message,
  );

  return (
    <StatusSummaryRoot ref={ref} onMouseMove={onMouseMove}>
      <AuroraBackdrop />

      <StatusSummaryLeft>
        <Typography variant="caption" color="textDisabled">
          {t("dashboard.globalStatus")}
        </Typography>

        <Typography variant="h4" color="textPrimary">
          <Trans
            i18nKey={statusMessage.headingKey}
            values={statusMessage.headingValues}
            components={{
              blocked: <HeadingCount statusVariant="blocked" />,
              stale: <HeadingCount statusVariant="stale" />,
            }}
          />
        </Typography>

        <Typography variant="body2" color="textSecondary">
          {t(statusMessage.adviceKey)}
        </Typography>

      </StatusSummaryLeft>

      <StatusSummaryRight>
        <StatusTag
          variant={systemStatus.variant}
          label={systemStatus.labelKey ? t(systemStatus.labelKey) : undefined}
        />

        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowsClockwiseIcon size={theme.iconSize.xs} />}
          onClick={handleRefresh}
        >
          {t("dashboard.refresh")}
        </Button>
      </StatusSummaryRight>
    </StatusSummaryRoot>
  );
};

export default StatusSummary;
