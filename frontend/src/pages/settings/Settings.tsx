import { useAuth } from "@/context/auth/AuthContext";
import AwsCredentialsSection from "@/pages/settings/components/AwsCredentialsSection";
import InviteCodeSection from "@/pages/settings/components/InviteCodeSection";
import ProfileSection from "@/pages/settings/components/ProfileSection";
import {
  SettingsHeader,
  SettingsRoot,
} from "@/pages/settings/components/settings.styled";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTranslation } from "react-i18next";

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { customer } = useAuth();

  return (
    <SettingsRoot>
      <SettingsHeader>
        <Typography variant="h5" color="textPrimary">
          {t('settings.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('settings.subtitle')}
        </Typography>
      </SettingsHeader>

      <ProfileSection />

      {/* Invite code and AWS credentials are company-level — managers only */}
      {customer?.role === 'manager' && <InviteCodeSection />}
      {customer?.role === 'manager' && <AwsCredentialsSection />}

    </SettingsRoot>
  );
};

export default Settings;
