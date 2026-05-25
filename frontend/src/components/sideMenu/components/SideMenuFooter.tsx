import React from 'react';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { GearIcon, SignOutIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { FooterRow, FooterLink } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenuFooter: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <FooterRow>
      <FooterLink>
        <GearIcon size={theme.iconSize.sm} />
        <Typography variant="body1" color="textPrimary">
          {t('nav.settings')}
        </Typography>
      </FooterLink>

      <FooterLink>
        <SignOutIcon size={theme.iconSize.sm} />
        <Typography variant="body1" color="textPrimary">
          {t('nav.signOut')}
        </Typography>
      </FooterLink>
    </FooterRow>
  );
};

export default SideMenuFooter;
