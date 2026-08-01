import type { TeamDialogProps } from "@/pages/team/types/team.types";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface TeamNameFormValues {
  name: string;
}

/** Shared create/rename dialog — a 409 duplicate-name error surfaces as an inline field error. */
const TeamDialog: React.FC<TeamDialogProps> = ({
  open,
  mode,
  initialName,
  isPending,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<TeamNameFormValues>({ defaultValues: { name: initialName } });

  useEffect(() => {
    if (open) reset({ name: initialName });
  }, [open, initialName, reset]);

  const submit = async ({ name }: TeamNameFormValues) => {
    const trimmed = name.trim();
    try {
      await onSave(trimmed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.startsWith("409")) {
        setError("name", { message: t("team.teams.nameDuplicateError", { name: trimmed }) });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            backgroundColor: theme.palette.surface.base,
            border: `1px solid ${theme.palette.border.default}`,
          },
        },
      }}
    >
      <form onSubmit={(event) => void handleSubmit(submit)(event)} noValidate>
        <DialogTitle>
          {mode === "create" ? t("team.teams.createDialogTitle") : t("team.teams.renameDialogTitle")}
        </DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("team.teams.nameFieldLabel")}
            {...register("name", { required: true })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit">
            {t("team.teams.cancel")}
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isPending}
            startIcon={
              isPending ? <CircularProgress size={theme.iconSize.xs} color="inherit" /> : undefined
            }
          >
            {mode === "create" ? t("team.teams.create") : t("team.teams.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TeamDialog;
