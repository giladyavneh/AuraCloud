import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { SIDEBAR_WIDTH } from '@/constants';

export const ItemRoot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
  height: 40,
  width: SIDEBAR_WIDTH - 32, // account for sidebar horizontal padding
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  overflow: 'hidden',

  ...(isActive
    ? {
        backgroundColor: theme.palette.divider,
        border: `1px solid ${theme.palette.border.strong}`,
        paddingLeft: 0,
      }
    : {
        backgroundColor: theme.palette.surface.subtle,
        border: '1px solid transparent',
        paddingLeft: theme.spacing(4),
      }),

  '&:hover': {
    backgroundColor: isActive ? theme.palette.divider : theme.palette.background.default,
    opacity: isActive ? 1 : 0.8,
  },
}));

export const ActiveIndicator = styled(Box)(({ theme }) => ({
  width: 4,
  height: 40,
  borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
  backgroundColor: theme.palette.primary.main,
  flexShrink: 0,
}));

export const ItemLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 400,
  lineHeight: 1,
  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  fontFamily: theme.typography.fontFamily,
}));
