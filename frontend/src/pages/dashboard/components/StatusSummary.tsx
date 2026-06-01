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
import { deriveStatusFromArnData } from "@/pages/dashboard/helpers/dashboard.helpers";
import type { ArnPermissionData } from "@/services/types/resources.types";
import StatusTag from "@/components/statusTag/StatusTag";
import {
  StatusSummaryLeft,
  StatusSummaryRight,
  StatusSummaryRoot,
} from "@/pages/dashboard/components/dashboard.styled";

const StatusSummary: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: permission } = useUserPermissions();

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPermissions });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResourceWatchlist });
  };

  const activeBlockers = Object.values(
    (permission?.permissionsData as Record<string, ArnPermissionData>) ?? {},
  )
    .map(deriveStatusFromArnData)
    .filter((s) => s === "blocked").length;

  const blockerColor =
    activeBlockers > 0 ? theme.palette.error.main : theme.palette.success.main;

  return (
    <StatusSummaryRoot>
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
        {/* TODO: replace hardcoded "online" with real system-health data once the
            Brain/health-check endpoint is implemented. */}
        <StatusTag variant="online" />

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
