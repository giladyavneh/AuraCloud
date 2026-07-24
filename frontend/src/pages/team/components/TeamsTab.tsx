import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog";
import EmptyState from "@/components/emptyState/EmptyState";
import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import FeedbackSnackbar from "@/components/feedbackSnackbar/FeedbackSnackbar";
import {
  useCreateTeam,
  useDeleteTeam,
  useEmployees,
  useRenameTeam,
  useTeams,
  useWatchlistPresets,
} from "@/hooks/team.hooks";
import { findTeamPreset, getTeamMembers } from "@/pages/team/helpers/team.helpers";
import TeamCard from "@/pages/team/components/TeamCard";
import TeamDialog from "@/pages/team/components/TeamDialog";
import { LoadingBox, TabHeaderRow, TeamsGrid } from "@/pages/team/components/team.styled";
import type { SnackbarState, Team } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import { PlusIcon, UsersThreeIcon } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const EMPTY_STATE_ICON_SIZE = 48;

type DialogState = { mode: "create" } | { mode: "rename"; team: Team };

const TeamsTab: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: "",
  });

  const {
    data: teams = [],
    isLoading: teamsLoading,
    isError: teamsError,
    error: teamsQueryError,
    refetch: refetchTeams,
  } = useTeams();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: presets = [], isLoading: presetsLoading } = useWatchlistPresets();

  const createMutation = useCreateTeam();
  const renameMutation = useRenameTeam();
  const deleteMutation = useDeleteTeam();

  const showSnackbar = (severity: "success" | "error", message: string) =>
    setSnackbar({ open: true, severity, message });

  const handleSaveTeam = async (name: string) => {
    try {
      if (dialogState?.mode === "create") {
        const team = await createMutation.mutateAsync(name);
        showSnackbar("success", t("team.teams.createSuccess", { name: team.name }));
        setDialogState(null);
      } else if (dialogState?.mode === "rename") {
        const team = await renameMutation.mutateAsync({ id: dialogState.team._id, name });
        showSnackbar("success", t("team.teams.renameSuccess", { name: team.name }));
        setDialogState(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.startsWith("409")) {
        showSnackbar(
          "error",
          dialogState?.mode === "create" ? t("team.teams.createError") : t("team.teams.renameError"),
        );
      }
      throw err;
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        showSnackbar("success", t("team.teams.deleteSuccess", { name }));
        setDeleteTarget(null);
      },
      onError: () => {
        showSnackbar("error", t("team.teams.deleteError"));
        setDeleteTarget(null);
      },
    });
  };

  const isLoading = teamsLoading || employeesLoading;
  const isDialogPending = createMutation.isPending || renameMutation.isPending;

  return (
    <>
      <TabHeaderRow>
        <Box />
        <Button
          variant="contained"
          startIcon={<PlusIcon size={theme.iconSize.sm} />}
          onClick={() => setDialogState({ mode: "create" })}
        >
          {t("team.teams.newTeam")}
        </Button>
      </TabHeaderRow>

      {isLoading && (
        <LoadingBox>
          <CircularProgress />
        </LoadingBox>
      )}

      {!isLoading && teamsError && (
        <ErrorRetryRow
          message={t("team.teams.loadError", { error: teamsQueryError?.message ?? "" })}
          retryLabel={t("team.teams.retry")}
          onRetry={() => void refetchTeams()}
        />
      )}

      {!isLoading && !teamsError && teams.length === 0 && (
        <EmptyState
          icon={
            <UsersThreeIcon size={EMPTY_STATE_ICON_SIZE} color={theme.palette.text.disabled} />
          }
          title={t("team.teams.emptyTitle")}
          description={t("team.teams.emptyDescription")}
          ctaLabel={t("team.teams.emptyCta")}
          onCta={() => setDialogState({ mode: "create" })}
        />
      )}

      {!isLoading && !teamsError && teams.length > 0 && (
        <TeamsGrid>
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              members={getTeamMembers(employees, team._id)}
              preset={findTeamPreset(presets, team._id)}
              presetsLoading={presetsLoading}
              onRename={() => setDialogState({ mode: "rename", team })}
              onDelete={() => setDeleteTarget(team)}
            />
          ))}
        </TeamsGrid>
      )}

      <TeamDialog
        open={dialogState !== null}
        mode={dialogState?.mode ?? "create"}
        initialName={dialogState?.mode === "rename" ? dialogState.team.name : ""}
        isPending={isDialogPending}
        onClose={() => setDialogState(null)}
        onSave={handleSaveTeam}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? t("team.confirmDialog.deleteTeamTitle", { teamName: deleteTarget.name }) : ""}
        body={t("team.confirmDialog.deleteTeamBody")}
        confirmLabel={t("team.confirmDialog.deleteTeamConfirm")}
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

export default TeamsTab;
