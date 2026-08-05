export const QUERY_KEYS = {
  userResourceWatchlist: ['userResourceWatchlist'],
  myPresetResources: ['myPresetResources'],
  userPermissions: ['userPermissions'],
  allResources: ['allResources'],
  resourceActions: (arn: string) => ['resourceActions', arn],
  companyBySlug: (slug: string) => ['company', slug],
  companyAwsUsers: (slug: string) => ['companyAwsUsers', slug],
  slugAvailability: (slug: string) => ['slugAvailability', slug],
  companyInviteCode: ['companyInviteCode'],
  employees: ['employees'],
  teams: ['teams'],
  watchlistPresets: ['watchlistPresets'],
  // Keyed on the redirect URI too: the answer includes whether that exact URI is
  // registered, so two requests from the same client are not interchangeable.
  consentRequest: (clientId: string, redirectUri: string) =>
    ['consentRequest', clientId, redirectUri],
  oauthGrants: ['oauthGrants'],
} as const;
