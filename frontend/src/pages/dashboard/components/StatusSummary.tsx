import React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTranslation } from "react-i18next";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import StatusTag from "@/components/statusTag/StatusTag";
import {
  StatusSummaryRoot,
  StatusSummaryLeft,
  StatusSummaryRight,
} from "@/pages/dashboard/components/dashboard.styled";

interface StatusSummaryProps {
  onRefresh: () => void;
}

const StatusSummary: React.FC<StatusSummaryProps> = ({ onRefresh }) => {
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

        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowsClockwiseIcon size={16} />}
          onClick={onRefresh}
        >
          {t("dashboard.refresh")}
        </Button>
      </StatusSummaryRight>
    </StatusSummaryRoot>
  );
};

export default StatusSummary;
