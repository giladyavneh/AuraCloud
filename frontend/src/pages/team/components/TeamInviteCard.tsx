import {
  AURA_CLOUD_DOMAIN,
  COPY_FEEDBACK_DURATION_MS,
  INVITE_CODE_FONT_SIZE,
  INVITE_CODE_LETTER_SPACING,
} from "@/constants";
import { useCompanyInviteCode } from "@/hooks/auth.hooks";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import {
  InviteCard,
  InviteFieldsGrid,
  InviteHeaderRow,
  InviteIconBadge,
  InviteLoadingBox,
} from "@/pages/team/components/team.styled";
import {
  CurrentKeyRow,
  SectionDivider,
} from "@/pages/settings/components/settings.styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CheckIcon, CopyIcon, UserPlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type CopiedField = "code" | "link" | null;

const TeamInviteCard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useCompanyInviteCode();

  // Cursor-following spotlight, same wiring the dashboard resource cards use.
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

  const [copied, setCopied] = useState<CopiedField>(null);

  const handleCopy = (text: string, field: Exclude<CopiedField, null>) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), COPY_FEEDBACK_DURATION_MS);
    });
  };

  const inviteLink = data ? `${AURA_CLOUD_DOMAIN}/${data.slug}/sign-up` : "";

  return (
    <InviteCard elevation={0} ref={ref} onMouseMove={onMouseMove}>
      <InviteHeaderRow>
        <InviteIconBadge>
          <UserPlusIcon size={theme.iconSize.sm} color={theme.palette.primary.main} aria-hidden />
        </InviteIconBadge>

        <Box>
          <Typography variant="subtitle1" color="textPrimary">
            {t("settings.invite.title")}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t("settings.invite.description")}
          </Typography>
        </Box>
      </InviteHeaderRow>

      <SectionDivider />

      {isLoading ? (
        <InviteLoadingBox>
          <CircularProgress size={theme.iconSize.sm} />
        </InviteLoadingBox>
      ) : isError ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
          <WarningCircleIcon size={theme.iconSize.sm} color={theme.palette.error.main} />
          <Typography variant="body2" color="error">
            {t("settings.invite.loadError")}
          </Typography>
          <Button variant="text" onClick={() => void refetch()}>
            {t("settings.invite.retry")}
          </Button>
        </Box>
      ) : (
        <>
          <InviteFieldsGrid>
            <Box>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", marginBottom: 1 }}
              >
                {t("settings.invite.codeLabel")}
              </Typography>
              <CurrentKeyRow>
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
                  {data?.inviteCode}
                </Typography>
                <Tooltip title={copied === "code" ? t("settings.invite.copied") : t("settings.invite.copyCode")}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(data?.inviteCode ?? "", "code")}
                    aria-label={copied === "code" ? t("settings.invite.copied") : t("settings.invite.copyCode")}
                  >
                    {copied === "code" ? (
                      <CheckIcon size={theme.iconSize.sm} color={theme.palette.success.main} />
                    ) : (
                      <CopyIcon size={theme.iconSize.sm} />
                    )}
                  </IconButton>
                </Tooltip>
              </CurrentKeyRow>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", marginBottom: 1 }}
              >
                {t("settings.invite.linkLabel")}
              </Typography>
              <CurrentKeyRow>
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
                  {inviteLink}
                </Typography>
                <Tooltip title={copied === "link" ? t("settings.invite.copied") : t("settings.invite.copyLink")}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(inviteLink, "link")}
                    aria-label={copied === "link" ? t("settings.invite.copied") : t("settings.invite.copyLink")}
                  >
                    {copied === "link" ? (
                      <CheckIcon size={theme.iconSize.sm} color={theme.palette.success.main} />
                    ) : (
                      <CopyIcon size={theme.iconSize.sm} />
                    )}
                  </IconButton>
                </Tooltip>
              </CurrentKeyRow>
            </Box>
          </InviteFieldsGrid>

          <Typography variant="caption" color="textSecondary">
            {t("settings.invite.hint")}
          </Typography>
        </>
      )}
    </InviteCard>
  );
};

export default TeamInviteCard;
