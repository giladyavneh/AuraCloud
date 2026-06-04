import AuraLogo from "@/components/auraLogo/AuraLogo";
import PixelBlast from "@/components/pixelBlast/PixelBlast";
import { useSubmitAwsCredentials } from "@/hooks/auth.hooks";
import { useAuth } from "@/context/auth/AuthContext";
import {
  BackgroundLayer,
  Divider,
  HeaderBlock,
  LogoBadge,
  OnboardCard,
  OnboardForm,
  OnboardRoot,
  OnboardStack,
  SecondaryCard,
  StepBlock,
  StepHeader,
  StepNumber,
} from "@/pages/onboard/components/onboard.styled";
import { CLOUDFORMATION_URL, ONBOARD_REDIRECT_DELAY_MS } from "@/constants";
import type { OnboardFormValues } from "@/pages/onboard/types/onboard.types";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import PasswordField from "@/components/passwordField/PasswordField";
import { ArrowSquareOutIcon, CheckCircleIcon, SignOutIcon } from "@phosphor-icons/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const Onboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mutate: submitCredentials, isPending, isSuccess, error } = useSubmitAwsCredentials();

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardFormValues>();

  const onSubmit = (values: OnboardFormValues) => {
    submitCredentials(values, {
      onSuccess: () => {
        setTimeout(() => navigate("/dashboard", { replace: true }), ONBOARD_REDIRECT_DELAY_MS);
      },
    });
  };

  return (
    <OnboardRoot>
      <BackgroundLayer>
        <PixelBlast
          variant="square"
          color={theme.palette.primary.main}
          pixelSize={4}
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.4}
          edgeFade={0.4}
          speed={0.4}
          rippleTrigger="window"
        />
      </BackgroundLayer>

      <OnboardStack>
      <OnboardCard elevation={0}>
        <HeaderBlock>
          <LogoBadge>
            <AuraLogo size={theme.iconSize.md} />
          </LogoBadge>
          <Typography variant="h5" color="textPrimary">
            {t("onboard.title")}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t("onboard.subtitle")}
          </Typography>
        </HeaderBlock>

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

              <PasswordField
                label={t("onboard.secretAccessKey")}
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

      <SecondaryCard elevation={0}>
        <Button
          variant="text"
          fullWidth
          color="inherit"
          startIcon={<SignOutIcon size={theme.iconSize.sm} />}
          onClick={logout}
          sx={{ color: 'text.secondary' }}
        >
          {t('onboard.signOut')}
        </Button>
      </SecondaryCard>

      </OnboardStack>
    </OnboardRoot>
  );
};

export default Onboard;
