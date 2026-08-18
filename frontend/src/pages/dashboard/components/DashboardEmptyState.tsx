import { DASHBOARD_IDS, EMPTY_STATE_ICON_SIZE } from "@/pages/dashboard/constants";
import { EmptyStateCard } from "@/pages/dashboard/components/dashboard.styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ArrowRightIcon, DatabaseIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const DashboardEmptyState: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <EmptyStateCard id={DASHBOARD_IDS.emptyState}>
      <DatabaseIcon size={EMPTY_STATE_ICON_SIZE} color={theme.palette.text.disabled} />

      <Box>
        <Typography variant="h6" color="textPrimary">
          {t("dashboard.emptyState.title")}
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
          {t("dashboard.emptyState.description")}
        </Typography>

      </Box>

      <Button
        variant="contained"
        size="large"
        endIcon={<ArrowRightIcon size={theme.iconSize.sm} />}
        onClick={() => navigate("/resource-watch-list")}
      >
        {t("dashboard.emptyState.cta")}
      </Button>

    </EmptyStateCard>
  );
};

export default DashboardEmptyState;
