export type RedirectClass = 'local' | 'remote' | 'blocked';

export interface HostLabels {
  /** Everything before the last two labels, trailing dot included. Rendered dimmed. */
  dim: string;
  emphasised: string;
}
