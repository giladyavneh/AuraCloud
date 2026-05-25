import StatCard from "@/components/statCard/StatCard";
import type { StatCardProps } from "@/components/statCard/types/statCard.types";
import { useUserPermissions, useUserResourceWatchlist } from "@/hooks/resources.hooks";
import { useTheme } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { deriveStatusFromArnData } from "../helpers/dashboard.helpers";
import { StatsRowContainer } from "./dashboard.styled";

const StatsRow: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Total resources comes from the watchlist (what the user is monitoring)
  const { data: watchlistItems = [] } = useUserResourceWatchlist();
  const totalResources = watchlistItems[0]?.resources.length ?? 0;

  // Blocker / stale / health stats come from the Brain output (UserPermissions)
  // Until the Brain is implemented these will be empty — show — rather than 0
  const { data: permission } = useUserPermissions();
  const arnStatuses = Object.values(permission?.permissionsData ?? {}).map(
    deriveStatusFromArnData,
  );
  const hasPermissionData = arnStatuses.length > 0;
  const activeBlockers = arnStatuses.filter((s) => s === "blocked").length;
  const staleResources = arnStatuses.filter((s) => s === "stale").length;
  const healthyCount = arnStatuses.filter((s) => s === "healthy").length;
  const healthScore = hasPermissionData
    ? `${Math.round((healthyCount / arnStatuses.length) * 100)}%`
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
    <StatsRowContainer>
      {stats.map(({ id, ...props }) => (
        <StatCard key={id} {...props} />
      ))}
    </StatsRowContainer>
  );
};

export default StatsRow;
