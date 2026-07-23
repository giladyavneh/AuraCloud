import type { EmployeeRowMenuProps } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import {
  ArrowLeftIcon,
  CheckIcon,
  DotsThreeVerticalIcon,
} from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type MenuView = "actions" | "assignTeam";

// One row in the assign-team list. Reserves a fixed-width leading slot (check when
// selected, empty otherwise) so every option's label left-aligns, and bolds the
// currently-assigned option.
const SelectableOption: React.FC<{ selected: boolean; label: string }> = ({ selected, label }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
      <Box sx={{ width: theme.iconSize.xs, display: "flex", flexShrink: 0 }}>
        {selected && <CheckIcon size={theme.iconSize.xs} />}
      </Box>

      <Box component="span" sx={{ fontWeight: selected ? 600 : 400 }}>
        {label}
      </Box>
    </Box>
  );
};

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

  const open = Boolean(anchorEl);
  const employeeName = `${employee.firstName} ${employee.lastName}`;
  const nextRole = employee.role === "manager" ? "employee" : "manager";
  const isDemoteBlocked = employee.role === "manager" && isOnlyManager;
  const isRemoveBlocked = isSelf || (employee.role === "manager" && isOnlyManager);
  const removeTooltip = isSelf
    ? t("team.employees.selfRemoveTooltip")
    : t("team.employees.lastManagerTooltip", { name: employeeName });

  // Move focus to the Back item when the drill-in view opens, so keyboard/
  // screen-reader users land somewhere real instead of nowhere.
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
        open={open}
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
        {view === "actions"
          ? [
              <Tooltip
                key="role"
                title={isDemoteBlocked ? t("team.employees.lastManagerTooltip", { name: employeeName }) : ""}
                arrow
                disableHoverListener={!isDemoteBlocked}
              >
                <span>
                  <MenuItem disabled={isDemoteBlocked} onClick={handleChangeRole}>
                    {nextRole === "manager"
                      ? t("team.employees.makeManager")
                      : t("team.employees.makeEmployee")}
                  </MenuItem>
                </span>
              </Tooltip>,
              <MenuItem key="assign" onClick={() => setView("assignTeam")}>
                {t("team.employees.assignToTeam")}
              </MenuItem>,
              <Divider key="divider" />,
              <Tooltip
                key="remove"
                title={isRemoveBlocked ? removeTooltip : ""}
                arrow
                disableHoverListener={!isRemoveBlocked}
              >
                <span>
                  <MenuItem
                    disabled={isRemoveBlocked}
                    onClick={handleRequestRemove}
                    sx={{ color: theme.palette.error.main }}
                  >
                    {t("team.employees.removeEmployee")}
                  </MenuItem>
                </span>
              </Tooltip>,
            ]
          : [
              <MenuItem key="back" ref={backItemRef} onClick={() => setView("actions")}>
                <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
                  <ArrowLeftIcon size={theme.iconSize.xs} />
                  {t("team.employees.assignToTeamBack")}
                </Box>
              </MenuItem>,
              <MenuItem key="none" onClick={() => handleAssignTeam(null)}>
                <SelectableOption selected={employee.teamId === null} label={t("team.employees.noTeamOption")} />
              </MenuItem>,
              ...teams.map((team) => (
                <MenuItem key={team._id} onClick={() => handleAssignTeam(team._id)}>
                  <SelectableOption selected={employee.teamId === team._id} label={team.name} />
                </MenuItem>
              )),
            ]}
      </Menu>
    </>
  );
};

export default EmployeeRowMenu;
