import {
  InvalidBlock,
  InvalidBody,
  InvalidHeading,
} from '@/pages/oauthConsent/components/oauthConsent.styled';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { WarningCircleIcon } from '@phosphor-icons/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

/**
 * The dead end for a request we cannot verify. It deliberately offers no way back to the
 * client: if we cannot confirm the redirect target is registered, sending the browser
 * there — even with an error code — makes us an open redirect.
 */
const ConsentInvalidRequest: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <InvalidBlock>
      <InvalidHeading>
        <WarningCircleIcon size={theme.iconSize.md} color={theme.palette.error.main} weight="fill" />

        <Typography variant="h5" component="h1" color="textPrimary">
          {t('consent.invalid.title')}
        </Typography>

      </InvalidHeading>

      <InvalidBody>
        <Typography variant="body2" color="textSecondary">
          {t('consent.invalid.body')}
        </Typography>

      </InvalidBody>

      <Button variant="text" component={RouterLink} to="/dashboard">
        {t('consent.invalid.backToDashboard')}
      </Button>

    </InvalidBlock>
  );
};

export default ConsentInvalidRequest;
