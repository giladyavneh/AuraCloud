import ConsentAccessItem from '@/pages/oauthConsent/components/ConsentAccessItem';
import { SectionBlock } from '@/pages/oauthConsent/components/oauthConsent.styled';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { EyeIcon, ListChecksIcon, UserIcon } from '@phosphor-icons/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const ConsentAccessList: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const iconProps = { size: theme.iconSize.sm, color: theme.palette.text.disabled };

  return (
    <SectionBlock>
      <Typography variant="caption" color="textSecondary" component="h2">
        {t('consent.access.sectionLabel')}
      </Typography>

      <ConsentAccessItem icon={<EyeIcon {...iconProps} />} label={t('consent.access.readStatus')} />
      <ConsentAccessItem
        icon={<ListChecksIcon {...iconProps} />}
        label={t('consent.access.manageWatchlist')}
      />
      <ConsentAccessItem icon={<UserIcon {...iconProps} />} label={t('consent.access.actAsYou')} />

    </SectionBlock>
  );
};

export default ConsentAccessList;
