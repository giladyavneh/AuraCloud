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
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CheckCircleIcon, ProhibitIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { AURA_CLOUD_DOMAIN, SLUG_DEBOUNCE_MS } from "@/constants";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { toSlug } from "@/pages/signUp/helpers/signUp.helpers";
import type { ManagerSignUpFormValues } from "@/pages/signUp/types/signUp.types";
import { fetchCompanyBySlug } from "@/services/auth.service";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { mutate: doSignUp, isPending, error } = useSignUp();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ManagerSignUpFormValues>();

  // Redirect already-authenticated users
  useEffect(() => {
    if (customer) {
      navigate('/dashboard', { replace: true });
    }
  }, [customer, navigate]);

  // Auto-suggest slug from company name
  const companyNameValue = watch('companyName');
  const companySlugValue = watch('companySlug');
  useEffect(() => {
    if (companyNameValue) {
      setValue('companySlug', toSlug(companyNameValue), { shouldValidate: false });
    }
  }, [companyNameValue, setValue]);

  // Debounce the slug value before firing the availability check
  const [debouncedSlug, setDebouncedSlug] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSlug(companySlugValue ?? ''), SLUG_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [companySlugValue]);

  const SLUG_PATTERN = /^[a-z0-9-]+$/;
  const hasPatternError = Boolean(companySlugValue) && !SLUG_PATTERN.test(companySlugValue);
  const slugToCheck = debouncedSlug && !hasPatternError ? debouncedSlug : '';

  // fetchCompanyBySlug throws on 404 → slug is available (isError = true = free)
  const {
    isFetching: isCheckingSlug,
    isSuccess: slugIsTaken,
    isError: slugIsAvailable,
  } = useQuery({
    queryKey: QUERY_KEYS.slugAvailability(slugToCheck),
    queryFn: () => fetchCompanyBySlug(slugToCheck),
    enabled: Boolean(slugToCheck),
    retry: false,
    staleTime: 30_000,
  });

  const onSubmit = (values: ManagerSignUpFormValues) => {
    doSignUp(
      { ...values, role: 'manager' },
      { onSuccess: () => navigate('/onboard', { replace: true }) },
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
            {t('signUp.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('signUp.subtitle')}
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
            label={t('signUp.companyName')}
            size="small"
            fullWidth
            {...register('companyName', { required: true })}
            error={!!errors.companyName}
          />

          <TextField
            label={t('signUp.companySlug')}
            size="small"
            fullWidth
            helperText={
              hasPatternError
                ? (errors.companySlug?.message ?? t('signUp.companySlugInvalid'))
                : slugIsTaken
                  ? t('signUp.companySlugTaken')
                  : `${AURA_CLOUD_DOMAIN}/${companySlugValue || t('signUp.companySlugPlaceholder')}`
            }
            slotProps={{
              inputLabel: { shrink: Boolean(companySlugValue) },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {hasPatternError ? (
                      <Tooltip title={t('signUp.tooltipInvalid')} arrow>
                        <ProhibitIcon size={theme.iconSize.sm} color={theme.palette.error.main} style={{ cursor: 'default' }} />
                      </Tooltip>
                    ) : isCheckingSlug ? (
                      <CircularProgress size={theme.iconSize.xs} />
                    ) : slugIsTaken ? (
                      <Tooltip title={t('signUp.tooltipTaken')} arrow>
                        <WarningCircleIcon size={theme.iconSize.sm} color={theme.palette.error.main} style={{ cursor: 'default' }} />
                      </Tooltip>
                    ) : slugIsAvailable ? (
                      <Tooltip title={t('signUp.tooltipAvailable', { slug: debouncedSlug })} arrow>
                        <CheckCircleIcon size={theme.iconSize.sm} color={theme.palette.success.main} style={{ cursor: 'default' }} />
                      </Tooltip>
                    ) : null}
                  </InputAdornment>
                ),
              },
            }}
            {...register('companySlug', {
              required: true,
              pattern: { value: /^[a-z0-9-]+$/, message: t('signUp.companySlugInvalid') },
              validate: () => !slugIsTaken || (t('signUp.companySlugTaken') as string),
            })}
            error={hasPatternError || slugIsTaken}
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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isPending}
            startIcon={isPending && <CircularProgress size={theme.iconSize.xs} color="inherit" />}
          >
            {isPending ? t('signUp.submitting') : t('signUp.submit')}
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

export default SignUp;
