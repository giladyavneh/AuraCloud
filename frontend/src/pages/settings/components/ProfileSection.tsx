import { useUpdateProfile } from "@/hooks/auth.hooks";
import { useAuth } from "@/context/auth/AuthContext";
import type { UpdateProfilePayload } from "@/services/types/auth.types";
import {
  FormActions,
  FormRow,
  SectionDivider,
  SectionHeader,
  SettingsCard,
  SettingsForm,
} from "@/pages/settings/components/settings.styled";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CheckCircleIcon } from "@phosphor-icons/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

const ProfileSection: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { customer } = useAuth();
  const { mutate: saveProfile, isPending, isSuccess, error, reset } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfilePayload>({
    defaultValues: {
      firstName: customer?.firstName ?? "",
      lastName: customer?.lastName ?? "",
      email: customer?.email ?? "",
      companyName: customer?.companyName ?? "",
      roleTitle: customer?.roleTitle ?? "",
    },
  });

  const onSubmit = (values: UpdateProfilePayload) => {
    saveProfile(values, {
      onSuccess: () => {
        // Reset dirty state so the success message shows after a clean save
        reset();
      },
    });
  };

  return (
    <SettingsCard elevation={0}>
      <SectionHeader>
        <Typography variant="subtitle1" color="textPrimary">
          {t("settings.profile.title")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t("settings.profile.description")}
        </Typography>
      </SectionHeader>

      <SectionDivider />

      {isSuccess && !isDirty && (
        <Alert severity="success" icon={<CheckCircleIcon size={theme.iconSize.sm} />}>
          {t("settings.profile.successMessage")}
        </Alert>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      <SettingsForm onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormRow>
          <TextField
            label={t("settings.profile.firstName")}
            size="small"
            fullWidth
            {...register("firstName", { required: true })}
            error={!!errors.firstName}
          />
          <TextField
            label={t("settings.profile.lastName")}
            size="small"
            fullWidth
            {...register("lastName", { required: true })}
            error={!!errors.lastName}
          />
        </FormRow>

        <TextField
          label={t("settings.profile.email")}
          type="email"
          size="small"
          fullWidth
          {...register("email", { required: true })}
          error={!!errors.email}
        />

        <FormRow>
          <TextField
            label={t("settings.profile.companyName")}
            size="small"
            fullWidth
            {...register("companyName", { required: true })}
            error={!!errors.companyName}
          />
          <TextField
            label={t("settings.profile.roleTitle")}
            size="small"
            fullWidth
            {...register("roleTitle", { required: true })}
            error={!!errors.roleTitle}
          />
        </FormRow>

        <FormActions>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending || !isDirty}
            startIcon={isPending && <CircularProgress size={theme.iconSize.xs} color="inherit" />}
          >
            {isPending ? t("settings.profile.saving") : t("settings.profile.save")}
          </Button>
        </FormActions>

      </SettingsForm>
    </SettingsCard>
  );
};

export default ProfileSection;
