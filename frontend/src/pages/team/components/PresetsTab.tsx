import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog";
import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import {
  useDeleteWatchlistPreset,
  useEmployees,
  useTeams,
  useWatchlistPresets,
} from "@/hooks/team.hooks";
import { formatTimestamp } from "@/pages/dashboard/helpers/dashboard.helpers";
import {
  isOrphanedIndividualPreset,
  resolveCreatedByName,
  resolvePresetScopeLabel,
} from "@/pages/team/helpers/team.helpers";
import PresetEditor from "@/pages/team/components/PresetEditor";
import {
  EmptyStateCard,
  LoadingBox,
  SectionCard,
  TabHeaderRow,
} from "@/pages/team/components/team.styled";
import type { SnackbarState, WatchlistPreset } from "@/pages/team/types/team.types";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  PencilSimpleIcon,
  PlusIcon,
  SparkleIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Mode = "list" | "editor";

const PresetsTab: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [mode, setMode] = useState<Mode>("list");
  const [editingPreset, setEditingPreset] = useState<WatchlistPreset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WatchlistPreset | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: "",
  });

  const {
    data: presets = [],
    isLoading: presetsLoading,
    isError: presetsError,
    error: presetsQueryError,
    refetch: refetchPresets,
  } = useWatchlistPresets();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  const deleteMutation = useDeleteWatchlistPreset();

  const showSnackbar = (severity: "success" | "error", message: string) =>
    setSnackbar({ open: true, severity, message });

  const resolveScopeLabel = (preset: WatchlistPreset) =>
    resolvePresetScopeLabel(preset, teams, employees, t("team.presets.removedEmployee"));

  const handleOpenCreate = () => {
    setEditingPreset(null);
    setMode("editor");
  };

  const handleOpenEdit = (preset: WatchlistPreset) => {
    setEditingPreset(preset);
    setMode("editor");
  };

  const handleEditorSaved = (message: string) => {
    showSnackbar("success", message);
    setMode("list");
  };

  const handleEditorError = (message: string) => {
    showSnackbar("error", message);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        showSnackbar("success", t("team.presets.deleteSuccess"));
        setDeleteTarget(null);
      },
      onError: () => {
        showSnackbar("error", t("team.presets.deleteError"));
        setDeleteTarget(null);
      },
    });
  };

  const columns = useMemo<MRT_ColumnDef<WatchlistPreset>[]>(
    () => [
      {
        id: "scope",
        header: t("team.presets.columns.scope"),
        accessorFn: (row) => resolveScopeLabel(row),
        Cell: ({ row }) => {
          const preset = row.original;
          const orphaned = isOrphanedIndividualPreset(preset, employees);
          const Icon = preset.scopeType === "team" ? UsersIcon : UserIcon;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
              <Box sx={{ display: "flex", flexShrink: 0 }}>
                <Icon
                  size={theme.iconSize.sm}
                  color={orphaned ? theme.palette.text.disabled : undefined}
                />
              </Box>

              <Typography
                variant="body2"
                color={orphaned ? "textDisabled" : "textPrimary"}
                sx={{ fontStyle: orphaned ? "italic" : "normal" }}
              >
                {orphaned ? t("team.presets.removedEmployee") : resolveScopeLabel(preset)}
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
        accessorFn: (row) => row.resources.length,
        Cell: ({ row }) => (
          <Typography variant="body2" color="textSecondary">
            {t("team.presets.resourceCount", { count: row.original.resources.length })}
          </Typography>
        ),
      },
      {
        id: "createdBy",
        header: t("team.presets.columns.createdBy"),
        accessorFn: (row) => resolveCreatedByName(row, employees) ?? "",
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
        size: 96,
        Cell: ({ row }) => {
          const preset = row.original;
          const orphaned = isOrphanedIndividualPreset(preset, employees);
          const scopeLabel = orphaned ? t("team.presets.removedEmployee") : resolveScopeLabel(preset);
          return (
            <Box sx={{ display: "flex", gap: theme.spacing(1) }}>
              <Tooltip title={orphaned ? t("team.presets.removedEmployeeTooltip") : t("team.presets.edit")}>
                <span>
                  <IconButton
                    size="small"
                    disabled={orphaned}
                    onClick={() => handleOpenEdit(preset)}
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
                  onClick={() => setDeleteTarget(preset)}
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
    // resolveScopeLabel closes over teams/employees, both listed below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, theme, teams, employees],
  );

  const table = useMaterialReactTable({
    columns,
    data: presets,
    enableGlobalFilter: true,
    initialState: { showGlobalFilter: true },
    enableColumnFilters: false,
    enableSorting: false,
    enablePagination: false,
    enableColumnActions: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableBottomToolbar: false,
    enableHiding: false,
    positionGlobalFilter: "right",
    muiTablePaperProps: { elevation: 0, sx: { backgroundColor: "transparent" } },
    muiTopToolbarProps: { sx: { backgroundColor: "transparent", paddingInline: 0 } },
    muiTableContainerProps: { sx: { backgroundColor: "transparent" } },
    muiTableHeadCellProps: { sx: { borderColor: theme.palette.border.default } },
    muiTableBodyCellProps: { sx: { borderColor: theme.palette.border.default } },
  });

  const isLoading = presetsLoading || teamsLoading || employeesLoading;

  if (mode === "editor") {
    return (
      <PresetEditor
        preset={editingPreset}
        teams={teams}
        employees={employees}
        presets={presets}
        onCancel={() => setMode("list")}
        onSaved={handleEditorSaved}
        onError={handleEditorError}
      />
    );
  }

  return (
    <>
      <TabHeaderRow>
        <Box />
        <Button variant="contained" startIcon={<PlusIcon size={theme.iconSize.sm} />} onClick={handleOpenCreate}>
          {t("team.presets.newPreset")}
        </Button>
      </TabHeaderRow>

      {isLoading && (
        <LoadingBox>
          <CircularProgress />
        </LoadingBox>
      )}

      {!isLoading && presetsError && (
        <ErrorRetryRow
          message={t("team.presets.loadError", { error: presetsQueryError?.message ?? "" })}
          retryLabel={t("team.presets.retry")}
          onRetry={() => void refetchPresets()}
        />
      )}

      {!isLoading && !presetsError && presets.length === 0 && (
        <EmptyStateCard>
          <SparkleIcon size={48} color={theme.palette.text.disabled} />

          <Box>
            <Typography variant="h6" color="textPrimary">
              {t("team.presets.emptyTitle")}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
              {t("team.presets.emptyDescription")}
            </Typography>
          </Box>

          <Button variant="contained" size="large" onClick={handleOpenCreate}>
            {t("team.presets.emptyCta")}
          </Button>
        </EmptyStateCard>
      )}

      {!isLoading && !presetsError && presets.length > 0 && (
        <SectionCard>
          <MaterialReactTable table={table} />
        </SectionCard>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("team.confirmDialog.deletePresetTitle")}
        body={
          deleteTarget
            ? t("team.confirmDialog.deletePresetBody", { scopeLabel: resolveScopeLabel(deleteTarget) })
            : ""
        }
        confirmLabel={t("team.confirmDialog.deletePresetConfirm")}
        cancelLabel={t("team.confirmDialog.cancel")}
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="standard"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PresetsTab;
