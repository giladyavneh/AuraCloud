import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import AuraLogo from '@/components/auraLogo/AuraLogo';
import { LogoContainer, LogoIconBox } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenuLogo: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <LogoContainer>
      <LogoIconBox>
        <AuraLogo size={theme.iconSize.md} />
      </LogoIconBox>

      <Box>
        <Typography variant="h5" color="textPrimary" noWrap>
          {t('app.name')}
        </Typography>
        <Typography variant="caption" color="textDisabled" noWrap>
          {t('app.subtitle')}
        </Typography>
      </Box>
    </LogoContainer>
  );
};

export default SideMenuLogo;
