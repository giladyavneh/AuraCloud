import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const CardRoot = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4),
  padding: theme.spacing(4),
  backgroundColor: theme.palette.surface.glow,
  border: `1px solid ${theme.palette.border.glow}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',

  // Decorative blurred glow blob — top right
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -80,
    right: 0,
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.25)} 0%, transparent 70%)`,
    pointerEvents: 'none',
  },

  // Decorative blurred glow blob — bottom left
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -100,
    left: 120,
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
}));

export const TextContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  position: 'relative',
  zIndex: 1,
});
