import React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTranslation } from "react-i18next";
import StatusTag from "@/components/statusTag/StatusTag";
import {
  StatusSummaryRoot,
  StatusSummaryLeft,
  StatusSummaryRight,
} from "@/pages/dashboard/components/dashboard.styled";

const StatusSummary: React.FC = () => {
  const { t } = useTranslation();

  return (
    <StatusSummaryRoot>
      <StatusSummaryLeft>
        <Typography variant="caption" color="textDisabled">
          {t("dashboard.globalStatus")}
        </Typography>

        <Typography variant="h4" color="textPrimary">
          {t("dashboard.healthHeading")}
        </Typography>
      </StatusSummaryLeft>

      <StatusSummaryRight>
        <StatusTag variant="online" />

        <Button variant="outlined" color="primary">
          {t("dashboard.refresh")}
        </Button>
      </StatusSummaryRight>
    </StatusSummaryRoot>
  );
};

export default StatusSummary;
