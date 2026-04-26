import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { useTranslation } from 'react-i18next';
import { ProfileRow } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenuProfile: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ProfileRow>
      <Avatar
        src=""
        alt={t('nav.profileName')}
        sx={(theme) => ({ width: 48, height: 48, bgcolor: theme.palette.divider })}
      />

      <Box>
        <Typography variant="body1" color="text.primary" noWrap>
          {t('nav.profileName')}
        </Typography>
        <Typography variant="body2" color="text.disabled" noWrap>
          {t('nav.profileRole')}
        </Typography>
      </Box>
    </ProfileRow>
  );
};

export default SideMenuProfile;
