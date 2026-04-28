import ResourceSection from "@/pages/dashboard/components/ResourceSection";
import StatusSummary from "@/pages/dashboard/components/StatusSummary";
import { PageRoot } from "@/pages/dashboard/components/dashboard.styled";
import React from "react";
import StatsRow from "./components/StatsRow";

const Dashboard: React.FC = () => {
  return (
    <PageRoot>
      <StatusSummary />

      <StatsRow />

      <ResourceSection />
    </PageRoot>
  );
};

export default Dashboard;
