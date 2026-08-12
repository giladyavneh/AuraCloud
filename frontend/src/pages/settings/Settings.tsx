import { useAuth } from "@/context/auth/AuthContext";
import AwsCredentialsSection from "@/pages/settings/components/AwsCredentialsSection";
import ConnectAiSection from "@/pages/settings/components/ConnectAiSection";
import InviteCodeSection from "@/pages/settings/components/InviteCodeSection";
import ProfileSection from "@/pages/settings/components/ProfileSection";
import {
  SettingsColumn,
  SettingsColumns,
  SettingsHeader,
  SettingsRoot,
} from "@/pages/settings/components/settings.styled";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTranslation } from "react-i18next";

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { customer } = useAuth();

  const isManager = customer?.role === 'manager';

  return (
    <SettingsRoot>
      <SettingsHeader>
        <Typography variant="h5" color="textPrimary" component="h1">
          {t('settings.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('settings.subtitle')}
        </Typography>
      </SettingsHeader>

      <SettingsColumns hasCompanyColumn={isManager}>
        <SettingsColumn>
          <ProfileSection />

          <ConnectAiSection />

        </SettingsColumn>

        {/* Invite code and AWS credentials are company-level — managers only */}
        {isManager && (
          <SettingsColumn>
            <InviteCodeSection />

            <AwsCredentialsSection />

          </SettingsColumn>
        )}

      </SettingsColumns>

    </SettingsRoot>
  );
};

export default Settings;
