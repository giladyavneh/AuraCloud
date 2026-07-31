import type { EmployeeActionsMenuProps } from "@/pages/team/types/team.types";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";

/** Default view of the employee row menu: change role, assign a team, or remove. */
const EmployeeActionsMenu: React.FC<EmployeeActionsMenuProps> = ({
  employeeName,
  nextRole,
  isDemoteBlocked,
  isRemoveBlocked,
  removeTooltip,
  onChangeRole,
  onShowTeamAssignment,
  onRequestRemove,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      <Tooltip
        title={
          isDemoteBlocked ? t("team.employees.lastManagerTooltip", { name: employeeName }) : ""
        }
        arrow
        disableHoverListener={!isDemoteBlocked}
      >
        <span>
          <MenuItem disabled={isDemoteBlocked} onClick={onChangeRole}>
            {nextRole === "manager"
              ? t("team.employees.makeManager")
              : t("team.employees.makeEmployee")}
          </MenuItem>
        </span>
      </Tooltip>

      <MenuItem onClick={onShowTeamAssignment}>{t("team.employees.assignToTeam")}</MenuItem>

      <Divider />

      <Tooltip title={isRemoveBlocked ? removeTooltip : ""} arrow disableHoverListener={!isRemoveBlocked}>
        <span>
          <MenuItem
            disabled={isRemoveBlocked}
            onClick={onRequestRemove}
            sx={{ color: theme.palette.error.main }}
          >
            {t("team.employees.removeEmployee")}
          </MenuItem>
        </span>
      </Tooltip>
    </>
  );
};

export default EmployeeActionsMenu;
