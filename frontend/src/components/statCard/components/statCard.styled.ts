import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const CardRoot = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});

export const CardInner = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(4, 6),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  height: '100%',
}));

export const StatValue = styled('p', {
  shouldForwardProp: (prop) => prop !== 'valueColor',
})<{ valueColor?: string }>(({ theme, valueColor }) => ({
  margin: 0,
  fontSize: '34px',
  fontWeight: 400,
  lineHeight: '40px',
  letterSpacing: '0.25px',
  color: valueColor ?? theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
}));
