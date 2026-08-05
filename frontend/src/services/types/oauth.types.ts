export interface ConsentRequest {
  clientId: string;
  clientName: string | null;
  redirectUri: string;
  /** False means the deny path must not navigate anywhere — see OAuthConsent. */
  isRedirectUriRegistered: boolean;
}

export interface ApprovePayload {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  state?: string;
}

export interface ApproveResponse {
  /** Fully-formed client callback URL with `code` and `state` already appended. */
  redirectTo: string;
}
