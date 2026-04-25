import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuItem from '@/components/menuItem/menuItem';
import { SIDEBAR_WIDTH } from '@/constants';

const NAV_ITEMS = [
  { label: 'nav.dashboard', path: '/dashboard' },
  { label: 'nav.resourceWatchList', path: '/resource-watch-list' },
] as const;

const SidebarRoot = styled(Box)({
  width: SIDEBAR_WIDTH,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  padding: '24px 16px',
  backgroundColor: '#0f172a',   // color/surface/subtle
  borderRight: '1px solid #1f2937', // color/border/default
  flexShrink: 0,
  overflow: 'hidden',
});

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  overflow: 'hidden',
});

const LogoIcon = styled(Box)({
  width: 48,
  height: 48,
  borderRadius: '10px',
  backgroundColor: '#dfb5fd', // color/bg/brand
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& svg': {
    color: '#0b0f19',
  },
});

const NavList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  overflow: 'hidden',
});

const BottomContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginTop: 'auto',
});

const ProfileRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const FooterRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const FooterLink = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
});

// Inline SVG for the logo arrow-up icon
const LogoSvg = () => (
  <svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L2 20h22L13 2z" fill="#0b0f19" />
  </svg>
);

// Inline SVG for gear/settings icon
const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke="#f8fafc"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke="#f8fafc"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Inline SVG for sign out icon
const SignOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      stroke="#f8fafc"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SideMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarRoot>
      {/* Header / Logo */}
      <LogoContainer>
        <LogoIcon>
          <LogoSvg />
        </LogoIcon>
        <Box>
          <Typography variant="h5" color="text.primary" noWrap>
            {t('app.name')}
          </Typography>
          <Typography variant="caption" color="text.disabled" noWrap>
            {t('app.subtitle')}
          </Typography>
        </Box>
      </LogoContainer>

      {/* Navigation */}
      <NavList>
        {NAV_ITEMS.map((item) => (
          <MenuItem
            key={item.path}
            label={t(item.label)}
            state={location.pathname === item.path ? 'active' : 'default'}
            onClick={() => navigate(item.path)}
          />
        ))}
      </NavList>

      {/* Bottom section */}
      <BottomContainer>
        <Divider sx={{ borderColor: '#334155' }} />
        <ProfileRow>
          <Avatar
            src=""
            alt="User profile"
            sx={{ width: 48, height: 48, bgcolor: '#1f2937' }}
          />
          <Box>
            <Typography variant="body1" color="text.primary" noWrap>
              Mike Wazowski
            </Typography>
            <Typography variant="body2" color="text.disabled" noWrap>
              Scare Assistant
            </Typography>
          </Box>
        </ProfileRow>
        <Divider sx={{ borderColor: '#334155' }} />
        <FooterRow>
          <FooterLink>
            <GearIcon />
            <Typography variant="body1" color="text.primary">
              {t('nav.settings')}
            </Typography>
          </FooterLink>
          <FooterLink>
            <SignOutIcon />
            <Typography variant="body1" color="text.primary">
              {t('nav.signOut')}
            </Typography>
          </FooterLink>
        </FooterRow>
      </BottomContainer>
    </SidebarRoot>
  );
};

export default SideMenu;
