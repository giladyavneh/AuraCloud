import StatCard from "@/components/statCard/StatCard";
import type { StatCardProps } from "@/components/statCard/types/statCard.types";
import { useUserPermissions, useUserResourceWatchlist } from "@/hooks/resources.hooks";
import { useTheme } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { countResourceStatuses, getHealthScoreBand } from "../helpers/dashboard.helpers";
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

  const hasWatchedResources = totalResources > 0;
  const activeBlockers = statusCounts.blocked;
  const staleResources = statusCounts.stale + statusCounts.unscanned;

  // Unscanned counts against the score, so it stays blank until something has
  // actually been evaluated rather than reporting 0% of nothing.
  const scannedCount = totalResources - statusCounts.unscanned;
  const healthScore = scannedCount > 0
    ? Math.round((statusCounts.healthy / totalResources) * 100)
    : undefined;

  const healthScoreColor = {
    good: theme.palette.success.main,
    fair: theme.palette.warning.main,
    poor: theme.palette.error.main,
  };

  const stats: Array<StatCardProps & { id: string }> = [
    {
      id: "totalResources",
      title: t("dashboard.stats.totalResources"),
      value: totalResources,
    },
    {
      id: "activeBlockers",
      title: t("dashboard.stats.activeBlockers"),
      value: hasWatchedResources ? activeBlockers : "—",
      // A zero count stays neutral; red on "0" reads as a problem.
      ...(activeBlockers > 0 ? { valueColor: theme.palette.error.main } : {}),
    },
    {
      id: "staleResources",
      title: t("dashboard.stats.staleResources"),
      value: hasWatchedResources ? staleResources : "—",
      ...(staleResources > 0 ? { valueColor: theme.palette.warning.main } : {}),
    },
    {
      id: "healthScore",
      title: t("dashboard.stats.healthScore"),
      value: healthScore === undefined ? "—" : `${healthScore}%`,
      ...(healthScore === undefined
        ? {}
        : { valueColor: healthScoreColor[getHealthScoreBand(healthScore)] }),
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
