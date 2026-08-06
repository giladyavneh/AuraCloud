import AuraLogo from '@/components/auraLogo/AuraLogo';
import ErrorRetryRow from '@/components/errorRetryRow/ErrorRetryRow';
import ConsentAccessList from '@/pages/oauthConsent/components/ConsentAccessList';
import ConsentActions from '@/pages/oauthConsent/components/ConsentActions';
import ConsentClientRow from '@/pages/oauthConsent/components/ConsentClientRow';
import ConsentDestination from '@/pages/oauthConsent/components/ConsentDestination';
import ConsentInvalidRequest from '@/pages/oauthConsent/components/ConsentInvalidRequest';
import PixelBlast from '@/components/pixelBlast/PixelBlast';
import {
  BackgroundLayer,
  ConsentCard,
  ConsentRoot,
  HeaderBlock,
  LoadingBlock,
  LogoBadge,
  VisuallyHidden,
} from '@/pages/oauthConsent/components/oauthConsent.styled';
import { useConsentRequest } from '@/pages/oauthConsent/hooks/oauthConsent.hooks';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

const OAuthConsent: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const state = useConsentRequest();

  if (state.status === 'unauthenticated') return <Navigate replace to={state.loginPath} />;

  const resolveLiveMessage = () => {
    if (state.status === 'loading') return t('consent.loading');
    if (state.status !== 'ready') return '';
    if (state.isApproving) return t('consent.approving');
    if (state.isDenying) return t('consent.denying');

    return '';
  };

  return (
    <ConsentRoot>
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
        />
      </BackgroundLayer>

      <ConsentCard elevation={0}>
        <HeaderBlock>
          <LogoBadge>
            <AuraLogo size={theme.iconSize.md} />
          </LogoBadge>

          {state.status !== 'invalid' && (
            <Typography variant="h5" component="h1" color="textPrimary">
              {t('consent.title')}
            </Typography>
          )}

          {state.status === 'ready' && (
            <Typography variant="body2" color="textSecondary">
              {t('consent.signedInAs', { email: state.email, company: state.companyName })}
            </Typography>
          )}

        </HeaderBlock>

        {state.status === 'loading' && (
          <LoadingBlock>
            <CircularProgress />
          </LoadingBlock>
        )}

        {state.status === 'invalid' && <ConsentInvalidRequest />}

        {state.status === 'loadError' && (
          <ErrorRetryRow
            message={t('consent.loadError')}
            retryLabel={t('consent.retry')}
            onRetry={state.onRetry}
          />
        )}

        {state.status === 'ready' && (
          <>
            <ConsentDestination
              redirectUri={state.redirectUri}
              redirectClass={state.redirectClass}
            />

            <ConsentClientRow clientName={state.clientName} redirectClass={state.redirectClass} />

            <ConsentAccessList />

            {!state.hasAwsConnected && (
              <Alert severity="warning">
                <AlertTitle>{t('consent.awsNotLinked.title')}</AlertTitle>
                {t('consent.awsNotLinked.body')}
              </Alert>
            )}

            {state.approveError && (
              <Alert severity="error">
                {t('consent.approveError', { error: state.approveError })}
              </Alert>
            )}

            <ConsentActions
              redirectClass={state.redirectClass}
              host={state.host}
              isApproving={state.isApproving}
              isDenying={state.isDenying}
              onApprove={state.onApprove}
              onDeny={state.onDeny}
            />

            <Typography variant="caption" color="textSecondary" align="center">
              {t('consent.footerNote')}
            </Typography>
          </>
        )}

        <VisuallyHidden aria-live="polite">{resolveLiveMessage()}</VisuallyHidden>

      </ConsentCard>

    </ConsentRoot>
  );
};

export default OAuthConsent;
