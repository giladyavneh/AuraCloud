import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const LayoutRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

export const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(6),
  minWidth: 0,
}));
