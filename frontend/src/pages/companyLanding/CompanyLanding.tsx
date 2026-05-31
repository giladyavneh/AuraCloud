import AuraLogo from "@/components/auraLogo/AuraLogo";
import PixelBlast from "@/components/pixelBlast/PixelBlast";
import { useCompanyBySlug } from "@/hooks/auth.hooks";
import {
  BackgroundLayer,
  FooterLink,
  HeaderBlock,
  LogoBadge,
  SignUpCard,
  SignUpRoot,
} from "@/pages/signUp/components/signUp.styled";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

const CompanyLanding: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { slug = '' } = useParams<{ slug: string }>();

  const { data: company, isLoading, isError } = useCompanyBySlug(slug);

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

          {isLoading && <CircularProgress size={theme.iconSize.md} />}

          {isError && (
            <Alert severity="error">{t('companyLanding.notFound')}</Alert>
          )}

          {company && (
            <>
              <Typography variant="h5" color="textPrimary">
                {company.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('companyLanding.subtitle')}
              </Typography>
            </>
          )}
        </HeaderBlock>

        {company && (
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate(`/${slug}/sign-up`)}
          >
            {t('companyLanding.signUp')}
          </Button>
        )}

        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
          {t('companyLanding.loginPrompt')}{' '}
          <FooterLink to="/login">{t('companyLanding.loginLink')}</FooterLink>
        </Typography>

      </SignUpCard>
    </SignUpRoot>
  );
};

export default CompanyLanding;
