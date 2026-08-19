import {
  AwsResourceModel,
  UserPermissionModel,
  UserResourceWatchlistModel,
} from './index.js';
import {
  resolveResourceStatus,
  type ArnPermissionEntry,
  type ResourceStatus,
} from './resourceStatus.js';

export interface WatchedResource {
  arn: string;
  actions: string[];
  /** Catalogue display name, absent once a resource leaves AWS. */
  name?: string;
  status: ResourceStatus;
}

interface WatchlistLean {
  _id: unknown;
  name: string;
  userId: string;
  resources: { arn: string; actions: string[] }[];
}

interface PermissionLean {
  name: string;
  userId: string;
  permissionsData?: unknown;
  updatedAt?: Date;
}

export interface WatchedResourcesView {
  /** Raw docs, for the response fields each consumer shapes itself. */
  watchlist: WatchlistLean | null;
  permission: PermissionLean | null;
  resources: WatchedResource[];
  permissionsData: Record<string, ArnPermissionEntry>;
}

/** Display names for the given ARNs, keyed by ARN. Missing ARNs are simply absent. */
export const resourceNamesFor = async (arns: string[]): Promise<Map<string, string>> => {
  if (arns.length === 0) return new Map();

  const catalogue = await AwsResourceModel.find(
    { arn: { $in: arns } },
    { arn: true, name: true },
  )
    .lean()
    .exec();

  return new Map(catalogue.map(({ arn, name }) => [arn, name]));
};

export const toWatchedResources = (
  watched: { arn: string; actions: string[] }[],
  permissionsData: Record<string, ArnPermissionEntry>,
  nameByArn: Map<string, string>,
  now: number = Date.now(),
): WatchedResource[] =>
  watched.map(({ arn, actions }) => {
    const name = nameByArn.get(arn);

    return {
      arn,
      actions: [...actions],
      ...(name ? { name } : {}),
      status: resolveResourceStatus(permissionsData[arn], now),
    };
  });

/**
 * The one read of a user's watched resources: watchlist joined with the Brain
 * output and the resource catalogue, with status resolved against the server clock.
 */
export const getWatchedResources = async (
  awsUserId: string,
): Promise<WatchedResourcesView> => {
  const [watchlist, permission] = await Promise.all([
    UserResourceWatchlistModel.findOne({ userId: awsUserId }).lean().exec(),
    UserPermissionModel.findOne({ userId: awsUserId }).lean().exec(),
  ]);

  const watched = watchlist?.resources ?? [];
  const permissionsData = (permission?.permissionsData ?? {}) as Record<
    string,
    ArnPermissionEntry
  >;
  const nameByArn = await resourceNamesFor(watched.map(({ arn }) => arn));

  return {
    watchlist: (watchlist as WatchlistLean | null) ?? null,
    permission: (permission as PermissionLean | null) ?? null,
    permissionsData,
    resources: toWatchedResources(watched, permissionsData, nameByArn),
  };
};
