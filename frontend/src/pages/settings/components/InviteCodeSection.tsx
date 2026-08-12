import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import { useCompanyInviteCode } from "@/hooks/auth.hooks";
import InviteCodeFields from "@/pages/settings/components/InviteCodeFields";
import {
  SectionDivider,
  SectionHeader,
  SettingsCard,
} from "@/pages/settings/components/settings.styled";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";

const InviteCodeSection: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useCompanyInviteCode();

  return (
    <SettingsCard elevation={0}>
      <SectionHeader>
        <Typography variant="subtitle1" color="textPrimary" component="h2">
          {t("settings.invite.title")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t("settings.invite.description")}
        </Typography>
      </SectionHeader>

      <SectionDivider />

      {isLoading && <CircularProgress size={theme.iconSize.sm} />}

      {!isLoading && isError && (
        <ErrorRetryRow
          message={t("settings.invite.loadError")}
          retryLabel={t("settings.invite.retry")}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <InviteCodeFields inviteCode={data.inviteCode} slug={data.slug} />
      )}
    </SettingsCard>
  );
};

export default InviteCodeSection;
