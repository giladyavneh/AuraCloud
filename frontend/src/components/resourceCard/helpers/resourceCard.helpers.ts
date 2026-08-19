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

export interface BlockedCause {
  reason: string;
  actionNames: string[];
}

/** One entry per denial reason — several actions usually fail for the same policy. */
export const groupBlockedActionsByCause = (actions: ResourceCardAction[]): BlockedCause[] => {
  const actionNamesByReason = new Map<string, string[]>();

  for (const { name, status, reason } of actions) {
    if (status !== "error") continue;

    const cause = reason ?? "";
    actionNamesByReason.set(cause, [...(actionNamesByReason.get(cause) ?? []), name]);
  }

  return [...actionNamesByReason].map(([reason, actionNames]) => ({ reason, actionNames }));
};
