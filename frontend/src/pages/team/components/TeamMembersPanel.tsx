import {
  TeamMemberRow,
  TeamMembersPanelRoot,
  TeamPresetLine,
} from "@/pages/team/components/team.styled";
import type { TeamMembersPanelProps } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { SparkleIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

// Read-only expanded view under a team card: the team's preset (if any) plus each
// member's name, role, and AWS-link status. All data is derived client-side from
// already-fetched queries — this component never fetches (see SPEC §2).
const TeamMembersPanel: React.FC<TeamMembersPanelProps> = ({ members, preset, presetsLoading }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <TeamMembersPanelRoot>
      {presetsLoading ? (
        <Typography variant="caption" color="textSecondary">
          {t("team.teams.members.presetLoading")}
        </Typography>
      ) : preset ? (
        <TeamPresetLine>
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <SparkleIcon size={theme.iconSize.xs} color={theme.palette.primary.main} />
          </Box>

          <Typography variant="caption" color="textPrimary">
            {t("team.teams.members.presetLine", {
              name: preset.name || t("team.teams.members.presetUnnamed"),
              count: preset.resources.length,
            })}
          </Typography>
        </TeamPresetLine>
      ) : (
        <Typography variant="caption" color="textSecondary">
          {t("team.teams.members.noPreset")}
        </Typography>
      )}

      {members.length === 0 ? (
        <Typography variant="body2" color="textDisabled" sx={{ fontStyle: "italic" }}>
          {t("team.teams.members.empty")}
        </Typography>
      ) : (
        members.map((member) => (
          <TeamMemberRow key={member._id}>
            <Typography variant="body2" color="textPrimary">
              {member.firstName} {member.lastName}
            </Typography>

            <Typography variant="caption" color="textSecondary">
              {member.roleTitle}
            </Typography>
          </TeamMemberRow>
        ))
      )}
    </TeamMembersPanelRoot>
  );
};

export default TeamMembersPanel;
