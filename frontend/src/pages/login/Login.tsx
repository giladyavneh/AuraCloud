import AuraLogo from "@/components/auraLogo/AuraLogo";
import PixelBlast from "@/components/pixelBlast/PixelBlast";
import { useLogin } from "@/hooks/auth.hooks";
import {
  BackgroundLayer,
  FooterLink,
  HeaderBlock,
  LogoBadge,
  LoginCard,
  LoginForm,
  LoginRoot,
} from "@/pages/login/components/login.styled";
import PasswordField from "@/components/passwordField/PasswordField";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth/AuthContext";

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { mutate: doLogin, isPending, error } = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();

  // Redirect already-authenticated users
  useEffect(() => {
    if (customer) {
      navigate(customer.hasAwsConnected ? "/dashboard" : "/onboard", { replace: true });
    }
  }, [customer, navigate]);

  const onSubmit = (values: LoginFormValues) => {
    doLogin(values, {
      onSuccess: ({ customer: c }) => {
        navigate(c.hasAwsConnected ? "/dashboard" : "/onboard", { replace: true });
      },
    });
  };

  return (
    <LoginRoot>
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
          // Listen for clicks page-wide so ripples also fire when the card is clicked
          rippleTrigger="window"
        />
      </BackgroundLayer>

      <LoginCard elevation={0}>
        <HeaderBlock>
          <LogoBadge>
            <AuraLogo size={theme.iconSize.md} />
          </LogoBadge>
          <Typography variant="h5" color="textPrimary">
            {t("login.title")}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t("login.subtitle")}
          </Typography>
        </HeaderBlock>

        {error && <Alert severity="error">{error.message}</Alert>}

        <LoginForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label={t("login.email")}
            type="email"
            size="small"
            fullWidth
            {...register("email", { required: true })}
            error={!!errors.email}
          />

          <PasswordField
            label={t("login.password")}
            size="small"
            fullWidth
            {...register("password", { required: true })}
            error={!!errors.password}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isPending}
            startIcon={isPending && <CircularProgress size={theme.iconSize.xs} color="inherit" />}
          >
            {isPending ? t("login.submitting") : t("login.submit")}
          </Button>
        </LoginForm>

        <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center" }}>
          {t("login.signUpPrompt")}{" "}
          <FooterLink to="/sign-up">{t("login.signUpLink")}</FooterLink>
        </Typography>

      </LoginCard>
    </LoginRoot>
  );
};

export default Login;
