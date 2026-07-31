import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserPermissions } from "@/hooks/resources.hooks";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  deriveStatusFromArnData,
  deriveSystemStatus,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import type { ArnPermissionData } from "@/services/types/resources.types";
import StatusTag from "@/components/statusTag/StatusTag";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import {
  StatusSummaryLeft,
  StatusSummaryRight,
  StatusSummaryRoot,
} from "@/pages/dashboard/components/dashboard.styled";

const StatusSummary: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
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

  const activeBlockers = Object.values(
    (permission?.permissionsData as Record<string, ArnPermissionData>) ?? {},
  )
    .map(deriveStatusFromArnData)
    .filter((status) => status === "blocked").length;

  const blockerColor =
    activeBlockers > 0 ? theme.palette.error.main : theme.palette.success.main;

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
          {t("dashboard.healthHeadingPrefix")}{" "}
          <Box component="span" sx={{ color: blockerColor }}>
            {activeBlockers}{" "}
            {t("dashboard.activeBlockersSuffix", { count: activeBlockers })}
          </Box>
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
