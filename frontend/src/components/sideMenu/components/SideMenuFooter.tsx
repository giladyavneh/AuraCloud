import React from 'react';
import Typography from '@mui/material/Typography';
import { GearIcon, SignOutIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { FooterRow, FooterLink } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenuFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <FooterRow>
      <FooterLink>
        <GearIcon size={20} />
        <Typography variant="body1" color="textPrimary">
          {t('nav.settings')}
        </Typography>
      </FooterLink>

      <FooterLink>
        <SignOutIcon size={20} />
        <Typography variant="body1" color="textPrimary">
          {t('nav.signOut')}
        </Typography>
      </FooterLink>
    </FooterRow>
  );
};

export default SideMenuFooter;
