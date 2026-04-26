import React from 'react';
import Typography from '@mui/material/Typography';
import { Gear, SignOut } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { FooterRow, FooterLink } from '@/components/sideMenu/sideMenu.styled';

const SideMenuFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <FooterRow>
      <FooterLink>
        <Gear size={20} />
        <Typography variant="body1" color="text.primary">
          {t('nav.settings')}
        </Typography>
      </FooterLink>

      <FooterLink>
        <SignOut size={20} />
        <Typography variant="body1" color="text.primary">
          {t('nav.signOut')}
        </Typography>
      </FooterLink>
    </FooterRow>
  );
};

export default SideMenuFooter;
