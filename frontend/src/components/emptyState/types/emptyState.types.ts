import type { ReactNode, Ref } from "react";

export interface EmptyStateProps {
  /** Rendered icon element, e.g. `<SparkleIcon size={48} />`. */
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
  /** For callers that have to move focus here after the content it replaced unmounted. */
  ctaRef?: Ref<HTMLButtonElement>;
}
