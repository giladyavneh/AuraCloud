import EmployeeActionsMenu from "@/pages/team/components/EmployeeActionsMenu";
import EmployeeTeamAssignmentMenu from "@/pages/team/components/EmployeeTeamAssignmentMenu";
import type { EmployeeRowMenuProps } from "@/pages/team/types/team.types";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import { useTheme } from "@mui/material/styles";
import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type MenuView = "actions" | "assignTeam";

const EmployeeRowMenu: React.FC<EmployeeRowMenuProps> = ({
  employee,
  teams,
  isOnlyManager,
  isSelf,
  isPending,
  onChangeRole,
  onChangeTeam,
  onRequestRemove,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [view, setView] = useState<MenuView>("actions");
  const backItemRef = useRef<HTMLLIElement>(null);

  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const nextRole = employee.role === "manager" ? "employee" : "manager";
  const isDemoteBlocked = employee.role === "manager" && isOnlyManager;
  const isRemoveBlocked = isSelf || (employee.role === "manager" && isOnlyManager);
  const removeTooltip = isSelf
    ? t("team.employees.selfRemoveTooltip")
    : t("team.employees.lastManagerTooltip", { name: employeeName });

  // Move focus to the Back item when the drill-in opens, so keyboard and screen
  // reader users land somewhere real instead of nowhere.
  useEffect(() => {
    if (view === "assignTeam") backItemRef.current?.focus();
  }, [view]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setView("actions");
  };

  const handleClose = () => {
    setAnchorEl(null);
    setView("actions");
  };

  const handleChangeRole = () => {
    onChangeRole(nextRole);
    handleClose();
  };

  const handleAssignTeam = (teamId: string | null) => {
    onChangeTeam(teamId);
    handleClose();
  };

  const handleRequestRemove = () => {
    onRequestRemove();
    handleClose();
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        disabled={isPending}
        aria-label={t("team.employees.rowMenuAria", { name: employeeName })}
      >
        {isPending ? (
          <CircularProgress size={theme.iconSize.xs} />
        ) : (
          <DotsThreeVerticalIcon size={theme.iconSize.sm} />
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: theme.palette.surface.base,
              border: `1px solid ${theme.palette.border.default}`,
            },
          },
        }}
      >
        {view === "actions" ? (
          <EmployeeActionsMenu
            employeeName={employeeName}
            nextRole={nextRole}
            isDemoteBlocked={isDemoteBlocked}
            isRemoveBlocked={isRemoveBlocked}
            removeTooltip={removeTooltip}
            onChangeRole={handleChangeRole}
            onShowTeamAssignment={() => setView("assignTeam")}
            onRequestRemove={handleRequestRemove}
          />
        ) : (
          <EmployeeTeamAssignmentMenu
            currentTeamId={employee.teamId}
            teams={teams}
            backItemRef={backItemRef}
            onBack={() => setView("actions")}
            onAssignTeam={handleAssignTeam}
          />
        )}
      </Menu>
    </>
  );
};

export default EmployeeRowMenu;
