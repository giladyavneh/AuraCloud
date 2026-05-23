import React from 'react';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuItem from '@/components/menuItem/MenuItem';
import SideMenuLogo from '@/components/sideMenu/components/SideMenuLogo';
import SideMenuProfile from '@/components/sideMenu/components/SideMenuProfile';
import SideMenuFooter from '@/components/sideMenu/components/SideMenuFooter';
import { NAV_ITEMS } from '@/components/sideMenu/helpers/sideMenu.helpers';
import { SidebarRoot, NavList, BottomContainer } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarRoot>
      <SideMenuLogo />

      <NavList>
        {NAV_ITEMS.map((item) => (
          <MenuItem
            key={item.path}
            label={t(item.labelKey)}
            state={location.pathname === item.path ? 'active' : 'default'}
            onClick={() => navigate(item.path)}
          />
        ))}
      </NavList>

      <BottomContainer>
        <Divider sx={(theme) => ({ borderColor: theme.palette.border.strong })} />
        <SideMenuProfile />
        <Divider sx={(theme) => ({ borderColor: theme.palette.border.strong })} />
        <SideMenuFooter />
      </BottomContainer>
    </SidebarRoot>
  );
};

export default SideMenu;
