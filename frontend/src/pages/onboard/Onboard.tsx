import { useSubmitAwsCredentials } from "@/hooks/auth.hooks";
import {
  Divider,
  OnboardCard,
  OnboardForm,
  OnboardRoot,
  StepBlock,
  StepHeader,
  StepNumber,
} from "@/pages/onboard/components/onboard.styled";
import { CLOUDFORMATION_URL } from "@/constants";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ArrowSquareOutIcon, CheckCircleIcon } from "@phosphor-icons/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface OnboardFormValues {
  accessKeyId: string;
  secretAccessKey: string;
}

const Onboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { mutate: submitCredentials, isPending, isSuccess, error } = useSubmitAwsCredentials();

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardFormValues>();

  const onSubmit = (values: OnboardFormValues) => {
    submitCredentials(values, {
      onSuccess: () => {
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      },
    });
  };

  return (
    <OnboardRoot>
      <OnboardCard elevation={0}>
        <div>
          <Typography variant="h5" color="textPrimary" gutterBottom>
            {t("onboard.title")}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t("onboard.subtitle")}
          </Typography>
        </div>

        {/* Step 1 */}
        <StepBlock>
          <StepHeader>
            <StepNumber>1</StepNumber>
            <Typography variant="subtitle1" color="textPrimary">
              {t("onboard.step1Title")}
            </Typography>
          </StepHeader>

          <Typography variant="body2" color="textSecondary">
            {t("onboard.step1Description")}
          </Typography>

          <Button
            variant="outlined"
            href={CLOUDFORMATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<ArrowSquareOutIcon size={theme.iconSize.xs} />}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("onboard.step1Button")}
          </Button>
        </StepBlock>

        <Divider />

        {/* Step 2 */}
        <StepBlock>
          <StepHeader>
            <StepNumber>2</StepNumber>
            <Typography variant="subtitle1" color="textPrimary">
              {t("onboard.step2Title")}
            </Typography>
          </StepHeader>

          <Typography variant="body2" color="textSecondary">
            {t("onboard.step2Description")}
          </Typography>

          {error && <Alert severity="error">{error.message}</Alert>}

          {isSuccess ? (
            <Alert
              severity="success"
              icon={<CheckCircleIcon size={theme.iconSize.sm} />}
            >
              <Typography variant="body2">{t("onboard.successTitle")}</Typography>
              <Typography variant="caption" color="textSecondary">
                {t("onboard.successDescription")}
              </Typography>
            </Alert>
          ) : (
            <OnboardForm onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                label={t("onboard.accessKeyId")}
                size="small"
                fullWidth
                {...register("accessKeyId", { required: true })}
                error={!!errors.accessKeyId}
              />

              <TextField
                label={t("onboard.secretAccessKey")}
                type="password"
                size="small"
                fullWidth
                {...register("secretAccessKey", { required: true })}
                error={!!errors.secretAccessKey}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isPending}
                startIcon={isPending && <CircularProgress size={theme.iconSize.xs} color="inherit" />}
                sx={{ alignSelf: "flex-start" }}
              >
                {isPending ? t("onboard.submitting") : t("onboard.submit")}
              </Button>
            </OnboardForm>
          )}

        </StepBlock>

      </OnboardCard>
    </OnboardRoot>
  );
};

export default Onboard;
