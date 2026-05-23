import ResourceSection from "@/pages/dashboard/components/ResourceSection";
import StatusSummary from "@/pages/dashboard/components/StatusSummary";
import { PageRoot } from "@/pages/dashboard/components/dashboard.styled";
import React from "react";
import StatsRow from "./components/StatsRow";
import { useUserPermissions } from "@/hooks/resources.hooks";
import { MOCK_USER_ID } from "@/constants";

const Dashboard: React.FC = () => {
  const { refetch } = useUserPermissions(MOCK_USER_ID);

  return (
    <PageRoot>
      <StatusSummary onRefresh={refetch} />

      <StatsRow />

      <ResourceSection />
    </PageRoot>
  );
};

export default Dashboard;
