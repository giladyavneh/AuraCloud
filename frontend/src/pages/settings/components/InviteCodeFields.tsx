import {
  AURA_CLOUD_DOMAIN,
  INVITE_CODE_FONT_SIZE,
  INVITE_CODE_LETTER_SPACING,
} from "@/constants";
import CopyField from "@/components/copyField/CopyField";
import type { InviteCodeFieldsProps } from "@/pages/settings/types/settings.types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";

const InviteCodeFields: React.FC<InviteCodeFieldsProps> = ({ inviteCode, slug }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const signUpLink = `${AURA_CLOUD_DOMAIN}/${slug}/sign-up`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <CopyField
        label={t("settings.invite.codeLabel")}
        value={inviteCode}
        copyLabel={t("settings.invite.copyCode")}
        copiedLabel={t("settings.invite.copied")}
      >
        <Typography
          variant="body2"
          color="textPrimary"
          sx={{
            fontFamily: theme.typography.fontFamilyMono,
            fontSize: INVITE_CODE_FONT_SIZE,
            letterSpacing: INVITE_CODE_LETTER_SPACING,
            flexGrow: 1,
          }}
        >
          {inviteCode}
        </Typography>
      </CopyField>

      <CopyField
        label={t("settings.invite.linkLabel")}
        value={signUpLink}
        copyLabel={t("settings.invite.copyLink")}
        copiedLabel={t("settings.invite.copied")}
      >
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{
            fontFamily: theme.typography.fontFamilyMono,
            fontSize: theme.typography.caption.fontSize,
            flexGrow: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {signUpLink}
        </Typography>
      </CopyField>

      <Typography variant="caption" color="textSecondary">
        {t("settings.invite.hint")}
      </Typography>
    </Box>
  );
};

export default InviteCodeFields;
