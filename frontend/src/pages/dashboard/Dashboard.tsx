import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import StatCard from "@/components/statCard/StatCard";
import type { StatCardProps } from "@/components/statCard/types/statCard.types";
import { useUserPermissions } from "@/hooks/resources.hooks";
import { deriveStatusFromArnData } from "@/pages/dashboard/helpers/dashboard.helpers";
import StatusSummary from "@/pages/dashboard/components/StatusSummary";
import ResourceSection from "@/pages/dashboard/components/ResourceSection";
import {
  PageRoot,
  StatsRow,
} from "@/pages/dashboard/components/dashboard.styled";
import { MOCK_USER_ID } from "@/constants";

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: permission } = useUserPermissions(MOCK_USER_ID);

  const arnStatuses = Object.values(permission?.permissionsData ?? {}).map(
    deriveStatusFromArnData,
  );

  const totalResources = arnStatuses.length;
  const activeBlockers = arnStatuses.filter((s) => s === "blocked").length;
  const staleResources = arnStatuses.filter((s) => s === "stale").length;
  const healthyCount = arnStatuses.filter((s) => s === "healthy").length;
  const healthScore =
    totalResources > 0
      ? `${Math.round((healthyCount / totalResources) * 100)}%`
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
      value: activeBlockers,
      valueColor: theme.palette.error.main,
    },
    {
      id: "staleResources",
      title: t("dashboard.stats.staleResources"),
      value: staleResources,
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
    <PageRoot>
      <StatusSummary />

      <StatsRow>
        {stats.map(({ id, ...props }) => (
          <StatCard key={id} {...props} />
        ))}
      </StatsRow>

      <ResourceSection />
    </PageRoot>
  );
};

export default Dashboard;
