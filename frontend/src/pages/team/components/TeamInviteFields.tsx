import {
  AURA_CLOUD_DOMAIN,
  INVITE_CODE_FONT_SIZE,
  INVITE_CODE_LETTER_SPACING,
} from "@/constants";
import CopyField from "@/components/copyField/CopyField";
import { InviteFieldsGrid } from "@/pages/team/components/team.styled";
import type { TeamInviteFieldsProps } from "@/pages/team/types/team.types";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";

const TeamInviteFields: React.FC<TeamInviteFieldsProps> = ({ inviteCode, slug }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const signUpLink = `${AURA_CLOUD_DOMAIN}/${slug}/sign-up`;

  return (
    <InviteFieldsGrid>
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
    </InviteFieldsGrid>
  );
};

export default TeamInviteFields;
