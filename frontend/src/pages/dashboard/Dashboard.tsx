import ResourceSection from "@/pages/dashboard/components/ResourceSection";
import StatusSummary from "@/pages/dashboard/components/StatusSummary";
import { PageRoot } from "@/pages/dashboard/components/dashboard.styled";
import { useUserPermissions } from "@/hooks/resources.hooks";
import StatsRow from "./components/StatsRow";
import React from "react";

const Dashboard: React.FC = () => {
  const { refetch } = useUserPermissions();

  return (
    <PageRoot>
      <StatusSummary onRefresh={refetch} />

      <StatsRow />

      <ResourceSection />
    </PageRoot>
  );
};

export default Dashboard;
