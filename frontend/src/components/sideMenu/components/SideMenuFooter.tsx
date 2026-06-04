import { useAuth } from '@/context/auth/AuthContext';
import { FooterLink, FooterRow } from '@/components/sideMenu/components/sideMenu.styled';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { GearIcon, SignOutIcon } from '@phosphor-icons/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const SideMenuFooter: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <FooterRow>
      <FooterLink onClick={() => navigate('/settings')} role="button" sx={{ cursor: 'pointer' }}>
        <GearIcon size={theme.iconSize.sm} />
        <Typography variant="body1" color="textPrimary">
          {t('nav.settings')}
        </Typography>
      </FooterLink>

      <FooterLink onClick={handleSignOut} role="button" sx={{ cursor: 'pointer' }}>
        <SignOutIcon size={theme.iconSize.sm} />
        <Typography variant="body1" color="textPrimary">
          {t('nav.signOut')}
        </Typography>
      </FooterLink>

    </FooterRow>
  );
};

export default SideMenuFooter;
