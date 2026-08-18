import StatCard from "@/components/statCard/StatCard";
import type { StatCardProps } from "@/components/statCard/types/statCard.types";
import { useUserPermissions, useUserResourceWatchlist } from "@/hooks/resources.hooks";
import { useTheme } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { countResourceStatuses } from "../helpers/dashboard.helpers";
import { StatsRowContainer } from "./dashboard.styled";
import { DASHBOARD_IDS } from "@/pages/dashboard/constants";

const StatsRow: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const { data: watchlistItems = [] } = useUserResourceWatchlist();
  const { data: permission } = useUserPermissions();

  const watchedArns = (watchlistItems[0]?.resources ?? []).map((resource) => resource.arn);
  const totalResources = watchedArns.length;
  const statusCounts = countResourceStatuses(watchedArns, permission?.resourceStatuses ?? {});

  // Unscanned counts against the score, so it cannot read 100% before the first scan.
  const hasPermissionData = totalResources > 0;
  const activeBlockers = statusCounts.blocked;
  const staleResources = statusCounts.stale + statusCounts.unscanned;
  const healthScore = hasPermissionData
    ? `${Math.round((statusCounts.healthy / totalResources) * 100)}%`
    : "—";

  const stats: Array<StatCardProps & { id: string }> = [
    {
      id: "totalResources",
      title: t("dashboard.stats.totalResources"),
      value: totalResources,
    },
    {
      id: "activeBlockers",
      title: t("dashboard.stats.activeBlockers"),
      value: hasPermissionData ? activeBlockers : "—",
      valueColor: theme.palette.error.main,
    },
    {
      id: "staleResources",
      title: t("dashboard.stats.staleResources"),
      value: hasPermissionData ? staleResources : "—",
      valueColor: theme.palette.warning.main,
    },
    {
      id: "healthScore",
      title: t("dashboard.stats.healthScore"),
      value: healthScore,
      valueColor: theme.palette.success.main,
    },
  ];

  return (
    <StatsRowContainer id={DASHBOARD_IDS.statsRow}>
      {stats.map(({ id, ...props }) => (
        <StatCard key={id} {...props} />
      ))}
    </StatsRowContainer>
  );
};

export default StatsRow;
