import type { Palette } from '@mui/material/styles';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';
import type { ResourceCardAction } from '@/components/resourceCard/types/resourceCard.types';
import type { PermissionStatus } from '@/services/types/resources.types';

export const MAX_VISIBLE_ACTIONS = 3;

export const getResourceDotColor = (palette: Palette, status: StatusTagVariant): string => {
  const map: Record<StatusTagVariant, string> = {
    healthy: palette.success.main,
    blocked: palette.error.main,
    stale: palette.warning.main,
    unscanned: palette.text.disabled,
    online: palette.success.main,
    external: palette.warning.main,
  };

  return map[status] ?? palette.text.disabled;
};

/** A resource whose data cannot be trusted paints every action with its own tag colour. */
export const getActionDotColor = (
  palette: Palette,
  resourceStatus: StatusTagVariant,
  actionStatus?: PermissionStatus,
): string => {
  if (resourceStatus === "stale" || resourceStatus === "unscanned") {
    return getResourceDotColor(palette, resourceStatus);
  }

  if (actionStatus === "valid") return palette.success.main;
  if (actionStatus === "error") return palette.error.main;

  return palette.text.disabled;
};

export const countBlockedActions = (actions: ResourceCardAction[]): number =>
  actions.filter(({ status }) => status === "error").length;
