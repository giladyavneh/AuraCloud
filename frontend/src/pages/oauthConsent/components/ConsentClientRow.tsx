import { IconRow } from '@/pages/oauthConsent/components/oauthConsent.styled';
import type { ConsentClientRowProps } from '@/pages/oauthConsent/types/oauthConsent.types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { InfoIcon } from '@phosphor-icons/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const ConsentClientRow: React.FC<ConsentClientRowProps> = ({ clientName }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <IconRow>
      <Box sx={{ display: 'flex', flexShrink: 0 }}>
        <InfoIcon size={theme.iconSize.sm} color={theme.palette.text.disabled} />
      </Box>

      <Typography variant="caption" color="textSecondary">
        {t('consent.client.notice', { clientName: clientName ?? t('consent.client.unnamed') })}
      </Typography>

    </IconRow>
  );
};

export default ConsentClientRow;
