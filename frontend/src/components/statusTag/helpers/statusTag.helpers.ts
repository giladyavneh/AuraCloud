import type { Palette } from '@mui/material/styles';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';

export interface TagStyleConfig {
  bg: string;
  border: string;
  color: string;
}

export const getTagStyles = (palette: Palette, variant: StatusTagVariant): TagStyleConfig => {
  const map: Record<StatusTagVariant, TagStyleConfig> = {
    healthy: {
      bg: palette.success.dark,
      border: palette.success.contrastText,
      color: palette.success.main,
    },
    blocked: {
      bg: palette.error.dark,
      border: palette.error.contrastText,
      color: palette.error.main,
    },
    stale: {
      bg: palette.divider,
      border: palette.border.strong,
      color: palette.text.disabled,
    },
    warning: {
      bg: palette.warning.dark,
      border: palette.warning.contrastText,
      color: palette.warning.main,
    },
    online: {
      bg: palette.success.dark,
      border: palette.success.contrastText,
      color: palette.success.main,
    },
  };

  return map[variant];
};

export const DEFAULT_LABELS: Record<StatusTagVariant, string> = {
  healthy: 'status.healthy',
  blocked: 'status.blocked',
  stale: 'status.stale',
  warning: 'status.warning',
  online: 'status.online',
};
