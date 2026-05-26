import ResourceSection from "@/pages/dashboard/components/ResourceSection";
import StatusSummary from "@/pages/dashboard/components/StatusSummary";
import { PageRoot } from "@/pages/dashboard/components/dashboard.styled";
import StatsRow from "./components/StatsRow";
import React from "react";

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
