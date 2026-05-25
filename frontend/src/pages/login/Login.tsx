import { useLogin } from "@/hooks/auth.hooks";
import {
  LoginCard,
  LoginForm,
  LoginRoot,
} from "@/pages/login/components/login.styled";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
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
      <LoginCard elevation={0}>
        <div>
          <Typography variant="h5" color="textPrimary" gutterBottom>
            {t("login.title")}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t("login.subtitle")}
          </Typography>
        </div>

        {error && (
          <Alert severity="error">{error.message}</Alert>
        )}

        <LoginForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label={t("login.email")}
            type="email"
            size="small"
            fullWidth
            {...register("email", { required: true })}
            error={!!errors.email}
          />

          <TextField
            label={t("login.password")}
            type="password"
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
            sx={{ marginTop: 1 }}
          >
            {isPending ? t("login.submitting") : t("login.submit")}
          </Button>
        </LoginForm>

        <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center" }}>
          {t("login.signUpPrompt")}{" "}
          <Link to="/sign-up" style={{ color: theme.palette.primary.main }}>
            {t("login.signUpLink")}
          </Link>
        </Typography>

      </LoginCard>
    </LoginRoot>
  );
};

export default Login;
