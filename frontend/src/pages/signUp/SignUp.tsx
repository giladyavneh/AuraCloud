import { useSignUp } from "@/hooks/auth.hooks";
import {
  NameRow,
  SignUpCard,
  SignUpForm,
  SignUpRoot,
} from "@/pages/signUp/components/signUp.styled";
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

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  roleTitle: string;
  password: string;
}

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { mutate: doSignUp, isPending, error } = useSignUp();

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormValues>();

  // Redirect already-authenticated users
  useEffect(() => {
    if (customer) {
      navigate(customer.hasAwsConnected ? "/dashboard" : "/onboard", { replace: true });
    }
  }, [customer, navigate]);

  const onSubmit = (values: SignUpFormValues) => {
    doSignUp(values, {
      onSuccess: () => navigate("/onboard", { replace: true }),
    });
  };

  return (
    <SignUpRoot>
      <SignUpCard elevation={0}>
        <div>
          <Typography variant="h5" color="textPrimary" gutterBottom>
            {t("signUp.title")}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t("signUp.subtitle")}
          </Typography>
        </div>

        {error && (
          <Alert severity="error">{error.message}</Alert>
        )}

        <SignUpForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <NameRow>
            <TextField
              label={t("signUp.firstName")}
              size="small"
              fullWidth
              {...register("firstName", { required: true })}
              error={!!errors.firstName}
            />
            <TextField
              label={t("signUp.lastName")}
              size="small"
              fullWidth
              {...register("lastName", { required: true })}
              error={!!errors.lastName}
            />
          </NameRow>

          <TextField
            label={t("signUp.email")}
            type="email"
            size="small"
            fullWidth
            {...register("email", { required: true })}
            error={!!errors.email}
          />

          <TextField
            label={t("signUp.companyName")}
            size="small"
            fullWidth
            {...register("companyName", { required: true })}
            error={!!errors.companyName}
          />

          <TextField
            label={t("signUp.roleTitle")}
            size="small"
            fullWidth
            {...register("roleTitle", { required: true })}
            error={!!errors.roleTitle}
          />

          <TextField
            label={t("signUp.password")}
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
            {isPending ? t("signUp.submitting") : t("signUp.submit")}
          </Button>
        </SignUpForm>

        <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center" }}>
          {t("signUp.loginPrompt")}{" "}
          <Link to="/login" style={{ color: theme.palette.primary.main }}>
            {t("signUp.loginLink")}
          </Link>
        </Typography>

      </SignUpCard>
    </SignUpRoot>
  );
};

export default SignUp;
