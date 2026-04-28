import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import AuraLogo from '@/components/auraLogo/AuraLogo';
import { LogoContainer, LogoIconBox } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenuLogo: React.FC = () => {
  const { t } = useTranslation();

  return (
    <LogoContainer>
      <LogoIconBox>
        <AuraLogo size={28} />
      </LogoIconBox>

      <Box>
        <Typography variant="h5" color="text.primary" noWrap>
          {t('app.name')}
        </Typography>
        <Typography variant="caption" color="text.disabled" noWrap>
          {t('app.subtitle')}
        </Typography>
      </Box>
    </LogoContainer>
  );
};

export default SideMenuLogo;
