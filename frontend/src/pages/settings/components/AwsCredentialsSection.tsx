import PasswordField from "@/components/passwordField/PasswordField";
import { useSubmitAwsCredentials } from "@/hooks/auth.hooks";
import { useAuth } from "@/context/auth/AuthContext";
import {
  CurrentKeyRow,
  FormActions,
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
import { CheckCircleIcon, KeyIcon } from "@phosphor-icons/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface AwsCredentialsFormValues {
  accessKeyId: string;
  secretAccessKey: string;
}

const AwsCredentialsSection: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { customer } = useAuth();

  // Reuse the same mutation as the onboard flow — it's a $set upsert
  const { mutate: updateCredentials, isPending, isSuccess, error, reset } = useSubmitAwsCredentials();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    resetField,
  } = useForm<AwsCredentialsFormValues>();

  const onSubmit = (values: AwsCredentialsFormValues) => {
    updateCredentials(values, {
      onSuccess: () => {
        // Clear the form inputs after a successful update
        resetField("accessKeyId");
        resetField("secretAccessKey");
        reset();
      },
    });
  };

  return (
    <SettingsCard elevation={0}>
      <SectionHeader>
        <Typography variant="subtitle1" color="textPrimary">
          {t("settings.aws.title")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t("settings.aws.description")}
        </Typography>
      </SectionHeader>

      <SectionDivider />

      {customer?.companyAwsAccessKeyId ? (
        <div>
          <Typography variant="caption" color="textSecondary" sx={{ display: "block", marginBottom: 1 }}>
            {t("settings.aws.currentKey")}
          </Typography>
          <CurrentKeyRow>
            <KeyIcon size={theme.iconSize.sm} color={theme.palette.text.secondary} />
            <Typography variant="body2" color="textSecondary" sx={{ fontFamily: theme.typography.fontFamilyMono, fontSize: "12px" }}>
              {customer.companyAwsAccessKeyId}
            </Typography>
          </CurrentKeyRow>
        </div>
      ) : (
        <Typography variant="body2" color="textSecondary">
          {t("settings.aws.notConnected")}
        </Typography>
      )}

      {isSuccess && (
        <Alert severity="success" icon={<CheckCircleIcon size={theme.iconSize.sm} />}>
          {t("settings.aws.successMessage")}
        </Alert>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      <SettingsForm onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label={t("settings.aws.accessKeyId")}
          size="small"
          fullWidth
          autoComplete="off"
          {...register("accessKeyId", { required: true })}
          error={!!errors.accessKeyId}
        />

        <PasswordField
          label={t("settings.aws.secretAccessKey")}
          size="small"
          fullWidth
          autoComplete="new-password"
          {...register("secretAccessKey", { required: true })}
          error={!!errors.secretAccessKey}
        />

        <FormActions>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending || !isDirty}
            startIcon={isPending && <CircularProgress size={theme.iconSize.xs} color="inherit" />}
          >
            {isPending ? t("settings.aws.saving") : t("settings.aws.save")}
          </Button>
        </FormActions>

      </SettingsForm>
    </SettingsCard>
  );
};

export default AwsCredentialsSection;
