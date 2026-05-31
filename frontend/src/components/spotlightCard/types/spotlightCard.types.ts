import type { PropsWithChildren } from "react";

export interface SpotlightCardProps extends PropsWithChildren {
  className?: string;
  /** rgba color string for the cursor-following spotlight. Falls back to a translucent primary. */
  spotlightColor?: string;
}
