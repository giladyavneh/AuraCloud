import {
  TeamCardHeaderRow,
  TeamCardRoot,
  TeamCardValue,
} from "@/pages/team/components/team.styled";
import type { TeamCardProps } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

const TeamCard: React.FC<TeamCardProps> = ({ team, memberCount, onRename, onDelete }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <TeamCardRoot>
      <TeamCardHeaderRow>
        <Typography variant="subtitle1" color="textPrimary">
          {team.name}
        </Typography>

        <Box sx={{ display: "flex", gap: theme.spacing(1) }}>
          <Tooltip title={t("team.teams.rename")}>
            <IconButton
              size="small"
              onClick={onRename}
              aria-label={t("team.teams.renameAria", { teamName: team.name })}
            >
              <PencilSimpleIcon size={theme.iconSize.xs} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t("team.teams.deleteTeam")}>
            <IconButton
              size="small"
              color="error"
              onClick={onDelete}
              aria-label={t("team.teams.deleteAria", { teamName: team.name })}
            >
              <TrashIcon size={theme.iconSize.xs} />
            </IconButton>
          </Tooltip>
        </Box>
      </TeamCardHeaderRow>

      <TeamCardValue>{memberCount}</TeamCardValue>

      <Typography variant="caption" color="textSecondary">
        {t("team.teams.memberCountLabel", { count: memberCount })}
      </Typography>
    </TeamCardRoot>
  );
};

export default TeamCard;
