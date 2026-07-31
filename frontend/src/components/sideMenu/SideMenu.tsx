import React from 'react';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth/AuthContext';
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
  const { customer } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.managerOnly || customer?.role === 'manager',
  );

  return (
    <SidebarRoot>
      <SideMenuLogo />

      <NavList>
        {visibleItems.map((item) => (
          <MenuItem
            key={item.path}
            label={t(item.labelKey)}
            icon={item.icon}
            // startsWith (not ===): nav items with sub-routes (e.g. /team/teams) must
            // still light up their parent nav entry. Safe here — no nav path is a
            // prefix of another.
            state={location.pathname.startsWith(item.path) ? 'active' : 'default'}
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
