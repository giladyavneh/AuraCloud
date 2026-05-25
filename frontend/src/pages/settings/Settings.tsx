import AwsCredentialsSection from "@/pages/settings/components/AwsCredentialsSection";
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

  return (
    <SettingsRoot>
      <SettingsHeader>
        <Typography variant="h5" color="textPrimary">
          {t("settings.title")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t("settings.subtitle")}
        </Typography>
      </SettingsHeader>

      <ProfileSection />

      <AwsCredentialsSection />

    </SettingsRoot>
  );
};

export default Settings;
