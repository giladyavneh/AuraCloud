import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Rendered icon element, e.g. `<SparkleIcon size={48} />`. */
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}
