import {
  AURA_CLOUD_DOMAIN,
  COPY_FEEDBACK_DURATION_MS,
  INVITE_CODE_FONT_SIZE,
  INVITE_CODE_LETTER_SPACING,
} from "@/constants";
import { useCompanyInviteCode } from "@/hooks/auth.hooks";
import {
  CurrentKeyRow,
  SectionDivider,
  SectionHeader,
  SettingsCard,
} from "@/pages/settings/components/settings.styled";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const InviteCodeSection: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading } = useCompanyInviteCode();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const handleCopy = (text: string, type: 'code' | 'link') => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), COPY_FEEDBACK_DURATION_MS);
    });
  };

  const inviteLink = data ? `${AURA_CLOUD_DOMAIN}/${data.slug}` : '';

  return (
    <SettingsCard elevation={0}>
      <SectionHeader>
        <Typography variant="subtitle1" color="textPrimary">
          {t('settings.invite.title')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('settings.invite.description')}
        </Typography>
      </SectionHeader>

      <SectionDivider />

      {isLoading ? (
        <CircularProgress size={theme.iconSize.sm} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Invite code */}
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', marginBottom: 1 }}>
              {t('settings.invite.codeLabel')}
            </Typography>
            <CurrentKeyRow>
              <Typography
                variant="body2"
                color="textPrimary"
                sx={{ fontFamily: theme.typography.fontFamilyMono, fontSize: INVITE_CODE_FONT_SIZE, letterSpacing: INVITE_CODE_LETTER_SPACING, flexGrow: 1 }}
              >
                {data?.inviteCode}
              </Typography>
              <Tooltip title={copied === 'code' ? t('settings.invite.copied') : t('settings.invite.copyCode')} arrow>
                <IconButton size="small" onClick={() => handleCopy(data?.inviteCode ?? '', 'code')}>
                  {copied === 'code'
                    ? <CheckIcon size={theme.iconSize.sm} color={theme.palette.success.main} />
                    : <CopyIcon size={theme.iconSize.sm} />}
                </IconButton>
              </Tooltip>
            </CurrentKeyRow>
          </Box>

          {/* Sign-up link */}
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', marginBottom: 1 }}>
              {t('settings.invite.linkLabel')}
            </Typography>
            <CurrentKeyRow>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontFamily: theme.typography.fontFamilyMono, fontSize: theme.typography.caption.fontSize, flexGrow: 1 }}
              >
                {inviteLink}/sign-up
              </Typography>
              <Tooltip title={copied === 'link' ? t('settings.invite.copied') : t('settings.invite.copyLink')} arrow>
                <IconButton size="small" onClick={() => handleCopy(`${inviteLink}/sign-up`, 'link')}>
                  {copied === 'link'
                    ? <CheckIcon size={theme.iconSize.sm} color={theme.palette.success.main} />
                    : <CopyIcon size={theme.iconSize.sm} />}
                </IconButton>
              </Tooltip>
            </CurrentKeyRow>
          </Box>

          <Typography variant="caption" color="textSecondary">
            {t('settings.invite.hint')}
          </Typography>

        </Box>
      )}
    </SettingsCard>
  );
};

export default InviteCodeSection;
