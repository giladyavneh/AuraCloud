import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';
import { getTagStyles } from '@/components/statusTag/helpers/statusTag.helpers';

export const TagContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tagVariant',
})<{ tagVariant: StatusTagVariant }>(({ theme, tagVariant }) => {
  const styles = getTagStyles(theme.palette, tagVariant);

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 2.5),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${styles.border}`,
    backgroundColor: styles.bg,
  };
});

export const Dot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tagVariant',
})<{ tagVariant: StatusTagVariant }>(({ theme, tagVariant }) => ({
  width: 7,
  height: 7,
  borderRadius: '50%',
  backgroundColor: getTagStyles(theme.palette, tagVariant).color,
  flexShrink: 0,
}));

export const TagLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'tagVariant',
})<{ tagVariant: StatusTagVariant }>(({ theme, tagVariant }) => ({
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 400,
  lineHeight: 1,
  color: getTagStyles(theme.palette, tagVariant).color,
  whiteSpace: 'nowrap',
  fontFamily: theme.typography.fontFamily,
}));
