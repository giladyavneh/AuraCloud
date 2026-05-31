import AuraLogo from "@/components/auraLogo/AuraLogo";
import PixelBlast from "@/components/pixelBlast/PixelBlast";
import { useAuth } from "@/context/auth/AuthContext";
import { useSignUp } from "@/hooks/auth.hooks";
import {
  BackgroundLayer,
  FooterLink,
  HeaderBlock,
  LogoBadge,
  NameRow,
  SignUpCard,
  SignUpForm,
  SignUpRoot,
} from "@/pages/signUp/components/signUp.styled";
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
import { useNavigate, useParams } from "react-router-dom";

interface EmployeeSignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  password: string;
  inviteCode: string;
}

const CompanySignUp: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { slug = '' } = useParams<{ slug: string }>();
  const { customer } = useAuth();
  const { mutate: doSignUp, isPending, error } = useSignUp();

  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeSignUpFormValues>();

  // Redirect already-authenticated users
  useEffect(() => {
    if (customer) {
      navigate('/dashboard', { replace: true });
    }
  }, [customer, navigate]);

  const onSubmit = (values: EmployeeSignUpFormValues) => {
    doSignUp(
      { ...values, role: 'employee', companySlug: slug },
      { onSuccess: () => navigate('/select-aws-user', { replace: true }) },
    );
  };

  return (
    <SignUpRoot>
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

      <SignUpCard elevation={0}>
        <HeaderBlock>
          <LogoBadge>
            <AuraLogo size={theme.iconSize.md} />
          </LogoBadge>
          <Typography variant="h5" color="textPrimary">
            {t('companySignUp.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('companySignUp.subtitle')}
          </Typography>
        </HeaderBlock>

        {error && <Alert severity="error">{error.message}</Alert>}

        <SignUpForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <NameRow>
            <TextField
              label={t('signUp.firstName')}
              size="small"
              fullWidth
              {...register('firstName', { required: true })}
              error={!!errors.firstName}
            />
            <TextField
              label={t('signUp.lastName')}
              size="small"
              fullWidth
              {...register('lastName', { required: true })}
              error={!!errors.lastName}
            />
          </NameRow>

          <TextField
            label={t('signUp.email')}
            type="email"
            size="small"
            fullWidth
            {...register('email', { required: true })}
            error={!!errors.email}
          />

          <TextField
            label={t('signUp.roleTitle')}
            size="small"
            fullWidth
            {...register('roleTitle', { required: true })}
            error={!!errors.roleTitle}
          />

          <PasswordField
            label={t('signUp.password')}
            size="small"
            fullWidth
            {...register('password', { required: true })}
            error={!!errors.password}
          />

          <TextField
            label={t('companySignUp.inviteCode')}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 6 } }}
            helperText={t('companySignUp.inviteCodeHelper')}
            {...register('inviteCode', { required: true, pattern: /^\d{6}$/ })}
            error={!!errors.inviteCode}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isPending}
            startIcon={isPending && <CircularProgress size={theme.iconSize.xs} color="inherit" />}
          >
            {isPending ? t('signUp.submitting') : t('companySignUp.submit')}
          </Button>
        </SignUpForm>

        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
          {t('signUp.loginPrompt')}{' '}
          <FooterLink to="/login">{t('signUp.loginLink')}</FooterLink>
        </Typography>

      </SignUpCard>
    </SignUpRoot>
  );
};

export default CompanySignUp;
