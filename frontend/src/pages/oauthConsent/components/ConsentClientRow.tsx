import { NoticeRow } from '@/pages/oauthConsent/components/oauthConsent.styled';
import type { ConsentClientRowProps } from '@/pages/oauthConsent/types/oauthConsent.types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { InfoIcon } from '@phosphor-icons/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const ConsentClientRow: React.FC<ConsentClientRowProps> = ({ clientName, redirectClass }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // The name is unverified either way, but only a destination that can carry the code off
  // this machine makes that worth warning about.
  const noticeKey = redirectClass === 'local' ? 'notice' : 'noticeUnverified';

  return (
    <NoticeRow>
      <Box sx={{ display: 'flex', flexShrink: 0 }}>
        <InfoIcon size={theme.iconSize.sm} color={theme.palette.text.disabled} />
      </Box>

      <Typography variant="caption" color="textSecondary">
        {t(`consent.client.${noticeKey}`, {
          clientName: clientName ?? t('consent.client.unnamed'),
        })}
      </Typography>

    </NoticeRow>
  );
};

export default ConsentClientRow;
