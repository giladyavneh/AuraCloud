import { formatTimestamp } from "@/pages/dashboard/helpers/dashboard.helpers";
import {
  isOrphanedIndividualPreset,
  resolveCreatedByName,
  resolvePresetScopeLabel,
} from "@/pages/team/helpers/team.helpers";
import type { Employee, Team, WatchlistPreset } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { PencilSimpleIcon, TrashIcon, UserIcon, UsersIcon } from "@phosphor-icons/react";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const ACTIONS_COLUMN_SIZE = 96;

interface PresetColumnActions {
  teams: Team[];
  employees: Employee[];
  onEdit: (preset: WatchlistPreset) => void;
  onDelete: (preset: WatchlistPreset) => void;
}

export const usePresetColumns = ({
  teams,
  employees,
  onEdit,
  onDelete,
}: PresetColumnActions): MRT_ColumnDef<WatchlistPreset>[] => {
  const { t } = useTranslation();
  const theme = useTheme();

  const scopeLabelFor = (preset: WatchlistPreset) =>
    resolvePresetScopeLabel(preset, teams, employees, t("team.presets.removedEmployee"));

  return useMemo<MRT_ColumnDef<WatchlistPreset>[]>(
    () => [
      {
        id: "scope",
        header: t("team.presets.columns.scope"),
        accessorFn: (preset) => scopeLabelFor(preset),
        Cell: ({ row }) => {
          const preset = row.original;
          const isOrphaned = isOrphanedIndividualPreset(preset, employees);
          const ScopeIcon = preset.scopeType === "team" ? UsersIcon : UserIcon;

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
              <Box sx={{ display: "flex", flexShrink: 0 }}>
                <ScopeIcon
                  size={theme.iconSize.sm}
                  color={isOrphaned ? theme.palette.text.disabled : undefined}
                />
              </Box>

              <Typography
                variant="body2"
                color={isOrphaned ? "textDisabled" : "textPrimary"}
                sx={{ fontStyle: isOrphaned ? "italic" : "normal" }}
              >
                {isOrphaned ? t("team.presets.removedEmployee") : scopeLabelFor(preset)}
              </Typography>
            </Box>
          );
        },
      },
      {
        accessorKey: "name",
        header: t("team.presets.columns.name"),
        Cell: ({ cell }) => (
          <Typography variant="body2" color="textSecondary">
            {cell.getValue<string | undefined>() || "—"}
          </Typography>
        ),
      },
      {
        id: "resources",
        header: t("team.presets.columns.resources"),
        accessorFn: (preset) => preset.resources.length,
        Cell: ({ row }) => (
          <Typography variant="body2" color="textSecondary">
            {t("team.presets.resourceCount", { count: row.original.resources.length })}
          </Typography>
        ),
      },
      {
        id: "createdBy",
        header: t("team.presets.columns.createdBy"),
        accessorFn: (preset) => resolveCreatedByName(preset, employees) ?? "",
        Cell: ({ row }) => (
          <Typography variant="body2" color="textSecondary">
            {resolveCreatedByName(row.original, employees) ?? "—"}
          </Typography>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: t("team.presets.columns.updated"),
        Cell: ({ cell }) => (
          <Typography variant="body2" color="textSecondary">
            {formatTimestamp(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        size: ACTIONS_COLUMN_SIZE,
        Cell: ({ row }) => {
          const preset = row.original;
          const isOrphaned = isOrphanedIndividualPreset(preset, employees);
          const scopeLabel = isOrphaned ? t("team.presets.removedEmployee") : scopeLabelFor(preset);

          return (
            <Box sx={{ display: "flex", gap: theme.spacing(1) }}>
              <Tooltip
                title={
                  isOrphaned ? t("team.presets.removedEmployeeTooltip") : t("team.presets.edit")
                }
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={isOrphaned}
                    onClick={() => onEdit(preset)}
                    aria-label={t("team.presets.editAria", { scopeLabel })}
                  >
                    <PencilSimpleIcon size={theme.iconSize.xs} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={t("team.presets.delete")}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(preset)}
                  aria-label={t("team.presets.deleteAria", { scopeLabel })}
                >
                  <TrashIcon size={theme.iconSize.xs} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    // scopeLabelFor closes over teams/employees, both listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, theme, teams, employees, onEdit, onDelete],
  );
};
