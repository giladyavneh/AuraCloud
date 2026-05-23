import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'bgColor' && prop !== 'iconSize',
})<{ bgColor: string; iconSize: number }>(({ theme, bgColor, iconSize }) => ({
  width: iconSize,
  height: iconSize,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: bgColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const ServiceLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'fontSize',
})<{ fontSize: number }>(({ theme, fontSize }) => ({
  color: theme.palette.common.white,
  fontFamily: theme.typography.fontFamily,
  fontWeight: 500,
  fontSize,
  lineHeight: 1,
  userSelect: 'none',
}));
