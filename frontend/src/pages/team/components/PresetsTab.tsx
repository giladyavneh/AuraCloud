import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog";
import EmptyState from "@/components/emptyState/EmptyState";
import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import FeedbackSnackbar from "@/components/feedbackSnackbar/FeedbackSnackbar";
import {
  useDeleteWatchlistPreset,
  useEmployees,
  useTeams,
  useWatchlistPresets,
} from "@/hooks/team.hooks";
import { resolvePresetScopeLabel } from "@/pages/team/helpers/team.helpers";
import PresetEditor from "@/pages/team/components/PresetEditor";
import PresetsTable from "@/pages/team/components/PresetsTable";
import { LoadingBox, SectionCard, TabHeaderRow } from "@/pages/team/components/team.styled";
import type { SnackbarState, WatchlistPreset } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import { PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const EMPTY_STATE_ICON_SIZE = 48;

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

  const isLoading = presetsLoading || teamsLoading || employeesLoading;

  const showSnackbar = (severity: "success" | "error", message: string) =>
    setSnackbar({ open: true, severity, message });

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

  const deleteBody = deleteTarget
    ? t("team.confirmDialog.deletePresetBody", {
        scopeLabel: resolvePresetScopeLabel(
          deleteTarget,
          teams,
          employees,
          t("team.presets.removedEmployee"),
        ),
      })
    : "";

  if (mode === "editor") {
    return (
      <PresetEditor
        preset={editingPreset}
        teams={teams}
        employees={employees}
        presets={presets}
        onCancel={() => setMode("list")}
        onSaved={handleEditorSaved}
        onError={(message) => showSnackbar("error", message)}
      />
    );
  }

  return (
    <>
      <TabHeaderRow>
        <Box />
        <Button
          variant="contained"
          startIcon={<PlusIcon size={theme.iconSize.sm} />}
          onClick={handleOpenCreate}
        >
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
        <EmptyState
          icon={<SparkleIcon size={EMPTY_STATE_ICON_SIZE} color={theme.palette.text.disabled} />}
          title={t("team.presets.emptyTitle")}
          description={t("team.presets.emptyDescription")}
          ctaLabel={t("team.presets.emptyCta")}
          onCta={handleOpenCreate}
        />
      )}

      {!isLoading && !presetsError && presets.length > 0 && (
        <SectionCard>
          <PresetsTable
            presets={presets}
            teams={teams}
            employees={employees}
            onEdit={handleOpenEdit}
            onDelete={setDeleteTarget}
          />
        </SectionCard>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("team.confirmDialog.deletePresetTitle")}
        body={deleteBody}
        confirmLabel={t("team.confirmDialog.deletePresetConfirm")}
        cancelLabel={t("team.confirmDialog.cancel")}
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <FeedbackSnackbar
        state={snackbar}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};

export default PresetsTab;
