import type { Palette } from '@mui/material/styles';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';

export const MAX_VISIBLE_ACTIONS = 3;

export const getResourceDotColor = (palette: Palette, status: StatusTagVariant): string => {
  const map: Record<StatusTagVariant, string> = {
    healthy: palette.success.main,
    blocked: palette.error.main,
    stale: palette.warning.main,
    online: palette.success.main,
  };

  return map[status] ?? palette.text.disabled;
};
