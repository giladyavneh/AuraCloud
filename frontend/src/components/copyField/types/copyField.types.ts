import type { ReactNode } from 'react';

export interface CopyFieldProps {
  /** Caption shown above the value row. */
  label: string;
  /** The exact text placed on the clipboard — may differ from what is displayed. */
  value: string;
  copyLabel: string;
  copiedLabel: string;
  /** The rendered value; callers control its typography. */
  children: ReactNode;
}
