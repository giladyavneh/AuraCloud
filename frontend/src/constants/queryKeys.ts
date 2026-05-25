export const QUERY_KEYS = {
  userResourceWatchlist: ['userResourceWatchlist'],
  userPermissions: ['userPermissions'],
  allResources: ['allResources'],
  resourceActions: (arn: string) => ['resourceActions', arn],
  currentUser: ['currentUser'],
} as const;
