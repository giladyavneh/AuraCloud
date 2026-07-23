import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import { useCompanyInviteCode } from "@/hooks/auth.hooks";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import TeamInviteFields from "@/pages/team/components/TeamInviteFields";
import {
  InviteCard,
  InviteHeaderRow,
  InviteIconBadge,
  InviteLoadingBox,
} from "@/pages/team/components/team.styled";
import { SectionDivider } from "@/pages/settings/components/settings.styled";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { UserPlusIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

const TeamInviteCard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useCompanyInviteCode();

  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

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

      {isLoading && (
        <InviteLoadingBox>
          <CircularProgress size={theme.iconSize.sm} />
        </InviteLoadingBox>
      )}

      {!isLoading && isError && (
        <ErrorRetryRow
          message={t("settings.invite.loadError")}
          retryLabel={t("settings.invite.retry")}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          <TeamInviteFields inviteCode={data.inviteCode} slug={data.slug} />

          <Typography variant="caption" color="textSecondary">
            {t("settings.invite.hint")}
          </Typography>
        </>
      )}
    </InviteCard>
  );
};

export default TeamInviteCard;
