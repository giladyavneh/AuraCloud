export interface ConsentRequest {
  clientId: string;
  clientName: string | null;
  redirectUri: string;
  /** False means the deny path must not navigate anywhere — see OAuthConsent. */
  isRedirectUriRegistered: boolean;
}

export interface ConnectedClient {
  id: string;
  clientId: string;
  /** Self-reported at registration and never verified — never the row's identity. */
  clientName: string | null;
  /** Registration order. Empty when the client's registration no longer exists. */
  redirectUris: string[];
  connectedAt: string;
  /** Null until the client's first refresh. */
  lastUsedAt: string | null;
}

/** Extends rather than redeclares, so the two lists cannot drift on the fields they share. */
export interface CompanyConnectedClient extends ConnectedClient {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
