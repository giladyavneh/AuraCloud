export const QUERY_KEYS = {
  userResourceWatchlist: ['userResourceWatchlist'],
  userPermissions: ['userPermissions'],
  allResources: ['allResources'],
  resourceActions: (arn: string) => ['resourceActions', arn],
  companyBySlug: (slug: string) => ['company', slug],
  companyAwsUsers: (slug: string) => ['companyAwsUsers', slug],
  slugAvailability: (slug: string) => ['slugAvailability', slug],
  companyInviteCode: ['companyInviteCode'],
} as const;
