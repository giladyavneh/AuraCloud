import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Triangle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { LogoContainer, LogoIconBox } from '@/components/sideMenu/sideMenu.styled';

const SideMenuLogo: React.FC = () => {
  const { t } = useTranslation();

  return (
    <LogoContainer>
      <LogoIconBox>
        <Triangle size={24} weight="fill" />
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
