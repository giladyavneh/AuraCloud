import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { SIDEBAR_WIDTH } from '@/constants';

export const SidebarRoot = styled(Box)(({ theme }) => ({
  width: SIDEBAR_WIDTH,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(6),
  padding: theme.spacing(6, 4),
  backgroundColor: theme.palette.surface.subtle,
  borderRight: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
  overflow: 'hidden',
}));

export const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  overflow: 'hidden',
}));

export const LogoIconBox = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: (theme.shape.borderRadius as number) + 2,
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: theme.palette.background.default,
}));

export const NavList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  overflow: 'hidden',
}));

export const BottomContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  marginTop: 'auto',
}));

export const ProfileRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
}));

export const FooterRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const FooterLink = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  cursor: 'pointer',
  color: theme.palette.text.primary,

  '&:hover': {
    opacity: 0.8,
  },
}));
