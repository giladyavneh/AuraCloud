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
  deriveHealthHeading,
  deriveStatusFromArnData,
  deriveSystemStatus,
} from "@/pages/dashboard/helpers/dashboard.helpers";
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

  // A resource the Brain has not reported on yet counts as stale, same rule the
  // resource list uses.
  const staleCount = monitoredResources.filter(({ arn }) => {
    const arnData = permissionsMap[arn];
    return !arnData || deriveStatusFromArnData(arnData) === "stale";
  }).length;

  const healthHeading = deriveHealthHeading({
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
      <StatusSummaryLeft>
        <Typography variant="caption" color="textDisabled">
          {t("dashboard.globalStatus")}
        </Typography>

        <Typography variant="h4" color="textPrimary">
          <Trans
            i18nKey={healthHeading.i18nKey}
            values={healthHeading.values}
            components={{
              blocked: <HeadingCount statusVariant="blocked" />,
              stale: <HeadingCount statusVariant="stale" />,
            }}
          />
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
