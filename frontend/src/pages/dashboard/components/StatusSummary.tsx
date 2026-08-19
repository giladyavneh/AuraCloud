import React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Trans, useTranslation } from "react-i18next";
import { ArrowsClockwiseIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { useUserPermissions, useUserResourceWatchlist } from "@/hooks/resources.hooks";
import { DASHBOARD_IDS, REFRESH_BUTTON_MIN_WIDTH } from "@/pages/dashboard/constants";
import { useDashboardRefresh } from "@/pages/dashboard/hooks/dashboard.hooks";
import {
  countResourceStatuses,
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
  const { phase: refreshPhase, refresh } = useDashboardRefresh();
  const { data: watchlistItems = [], isLoading: isWatchlistLoading } = useUserResourceWatchlist();
  const {
    data: permission,
    isLoading: isPermissionLoading,
    isError: isPermissionError,
  } = useUserPermissions();

  // Cursor-following spotlight, same wiring the dashboard resource cards use.
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

  const monitoredResources = watchlistItems[0]?.resources ?? [];
  const resourceStatuses = permission?.resourceStatuses ?? {};

  const watchedArns = monitoredResources.map((resource) => resource.arn);
  const statusCounts = countResourceStatuses(watchedArns, resourceStatuses);

  const statusMessage = deriveStatusMessage({
    isLoading: isWatchlistLoading || isPermissionLoading,
    monitoredCount: watchedArns.length,
    blockedCount: statusCounts.blocked,
    staleCount: statusCounts.stale,
    unscannedCount: statusCounts.unscanned,
  });

  const refreshIcon = {
    idle: <ArrowsClockwiseIcon size={theme.iconSize.xs} />,
    refreshing: <CircularProgress size={theme.iconSize.xs} color="inherit" />,
    refreshed: <CheckCircleIcon size={theme.iconSize.xs} weight="fill" />,
  }[refreshPhase];

  const systemStatus = deriveSystemStatus(
    isPermissionLoading,
    isPermissionError,
    watchedArns.length,
    statusCounts.stale,
  );

  return (
    <StatusSummaryRoot id={DASHBOARD_IDS.statusSummary} ref={ref} onMouseMove={onMouseMove}>
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
          color={refreshPhase === "refreshed" ? "success" : "primary"}
          startIcon={refreshIcon}
          disabled={refreshPhase === "refreshing"}
          onClick={() => void refresh()}
          sx={{ minWidth: REFRESH_BUTTON_MIN_WIDTH }}
        >
          {t(refreshPhase === "refreshed" ? "dashboard.refreshed" : "dashboard.refresh")}
        </Button>
      </StatusSummaryRight>
    </StatusSummaryRoot>
  );
};

export default StatusSummary;
