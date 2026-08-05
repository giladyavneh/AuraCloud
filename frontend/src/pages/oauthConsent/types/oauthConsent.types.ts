import type { ReactNode } from 'react';

export type RedirectClass = 'local' | 'remote' | 'blocked';

/**
 * `blocked` is routed to the dead-end page instead of the destination panel, so nothing
 * that renders a panel ever sees it. Narrowing here is what keeps that guarantee — the
 * compiler rejects a blocked branch rather than leaving unreachable styling behind.
 */
export type RenderedRedirectClass = Exclude<RedirectClass, 'blocked'>;

export interface ConsentParams {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  state?: string;
}

export interface HostLabels {
  /** Everything before the last two labels, trailing dot included. Rendered dimmed. */
  dim: string;
  emphasised: string;
}

export interface ConsentReadyState {
  status: 'ready';
  redirectUri: string;
  redirectClass: RenderedRedirectClass;
  host: string;
  clientName: string | null;
  email: string;
  companyName: string;
  hasAwsConnected: boolean;
  isApproving: boolean;
  isDenying: boolean;
  approveError: string | null;
  onApprove: () => void;
  onDeny: () => void;
}

export type ConsentViewState =
  | { status: 'loading' }
  | { status: 'unauthenticated'; loginPath: string }
  | { status: 'invalid' }
  | { status: 'loadError'; onRetry: () => void }
  | ConsentReadyState;

export interface ConsentDestinationProps {
  redirectUri: string;
  redirectClass: RenderedRedirectClass;
}

export interface ConsentClientRowProps {
  clientName: string | null;
}

export interface ConsentAccessItemProps {
  icon: ReactNode;
  label: string;
}

export interface ConsentActionsProps {
  redirectClass: RenderedRedirectClass;
  host: string;
  isApproving: boolean;
  isDenying: boolean;
  onApprove: () => void;
  onDeny: () => void;
}
