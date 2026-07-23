import TeamAssignmentOption from "@/pages/team/components/TeamAssignmentOption";
import type { EmployeeTeamAssignmentMenuProps } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

/** Drill-in view of the employee row menu: pick the team this employee belongs to. */
const EmployeeTeamAssignmentMenu: React.FC<EmployeeTeamAssignmentMenuProps> = ({
  currentTeamId,
  teams,
  backItemRef,
  onBack,
  onAssignTeam,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      <MenuItem ref={backItemRef} onClick={onBack}>
        <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
          <ArrowLeftIcon size={theme.iconSize.xs} />
          {t("team.employees.assignToTeamBack")}
        </Box>
      </MenuItem>

      <MenuItem onClick={() => onAssignTeam(null)}>
        <TeamAssignmentOption
          isSelected={currentTeamId === null}
          label={t("team.employees.noTeamOption")}
        />
      </MenuItem>

      {teams.map((team) => (
        <MenuItem key={team._id} onClick={() => onAssignTeam(team._id)}>
          <TeamAssignmentOption isSelected={currentTeamId === team._id} label={team.name} />
        </MenuItem>
      ))}
    </>
  );
};

export default EmployeeTeamAssignmentMenu;
