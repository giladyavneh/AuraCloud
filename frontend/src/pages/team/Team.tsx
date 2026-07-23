import { useAuth } from "@/context/auth/AuthContext";
import EmployeesTab from "@/pages/team/components/EmployeesTab";
import PresetsTab from "@/pages/team/components/PresetsTab";
import TeamsTab from "@/pages/team/components/TeamsTab";
import {
  PageHeader,
  PageRoot,
  TabContent,
  TabsRoot,
} from "@/pages/team/components/team.styled";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation } from "react-router-dom";

const TEAM_TABS = [
  { path: "/team", labelKey: "team.tabs.employees" },
  { path: "/team/teams", labelKey: "team.tabs.teams" },
  { path: "/team/presets", labelKey: "team.tabs.presets" },
] as const;

const Team: React.FC = () => {
  const { t } = useTranslation();
  const { customer } = useAuth();
  const location = useLocation();

  // Manager-only surface — guard the route itself, not just nav visibility.
  if (customer?.role !== "manager") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageRoot>
      <PageHeader>
        <Typography variant="h5" color="textPrimary">
          {t("team.title")}
        </Typography>

        <Typography variant="body2" color="textSecondary">
          {t("team.subtitle", { companyName: customer.companyName })}
        </Typography>
      </PageHeader>

      <TabsRoot value={location.pathname} aria-label={t("team.tabsAriaLabel")}>
        {TEAM_TABS.map((tab) => (
          <Tab
            key={tab.path}
            label={t(tab.labelKey)}
            value={tab.path}
            component={Link}
            to={tab.path}
          />
        ))}
      </TabsRoot>

      <TabContent>
        {location.pathname === "/team/teams" && <TeamsTab />}
        {location.pathname === "/team/presets" && <PresetsTab />}
        {location.pathname === "/team" && <EmployeesTab />}
      </TabContent>
    </PageRoot>
  );
};

export default Team;
