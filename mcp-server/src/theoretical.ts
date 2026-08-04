import {
  buildEvaluationSubject,
  disconnectRedis,
  evaluateResourceActions,
  getRedisClient,
  UserResourceWatchlistModel,
  type EvaluationResult,
  type RedisClientType,
} from "utils";
import type { UserContext } from "./identity.js";
import { DomainError, assertWatchableArn, unknownActionWarnings } from "./watchlist.js";

export interface TheoreticalPermissionResult {
  arn: string;
  action: string;
  /** Same vocabulary as get_permission_status: 'valid' = allowed, 'error' = blocked. */
  status: "valid" | "error";
  allowed: boolean;
  reason: string;
  /** Whether this resource is also on the user's watchlist (see get_permission_status). */
  watched: boolean;
  evaluatedAt: string;
  warnings?: string[];
  details?: { context: EvaluationResult["context"]; steps: EvaluationResult["steps"] };
}

const crawlerCache = async (): Promise<RedisClientType> => {
  try {
    // getRedisClient()'s concrete client type and the bare RedisClientType alias
    // disagree only on node-redis's RESP-version generic (the runtime object is
    // the same client; logic/src passes it the same way) — hence the cast.
    return (await getRedisClient()) as unknown as RedisClientType;
  } catch {
    // utils caches the rejected connection promise; clear it so the next call
    // can retry once Redis is back instead of failing forever.
    await disconnectRedis().catch(() => {});
    throw new DomainError(
      "The crawler cache (Redis) is unreachable — theoretical evaluation runs against live crawled data and needs it. Start the stack's Redis and retry.",
    );
  }
};

/** True if this ARN is on the acting user's watchlist. */
const isArnWatched = async (ctx: UserContext, arn: string): Promise<boolean> =>
  Boolean(
    await UserResourceWatchlistModel.exists({
      userId: ctx.linkedAwsUserId,
      "resources.arn": arn,
    }).exec(),
  );

/**
 * Live, read-only "would I be allowed?" evaluation for any discovered resource,
 * watched or not. Runs the same subject assembly and shared evaluation step as
 * the logic service (the documented account-fallback edge below is the one
 * known divergence), so a theoretical verdict matches what the dashboard would
 * show if the resource were watched. Never writes anything.
 */
export const checkTheoreticalPermission = async (
  ctx: UserContext,
  arn: string,
  action: string,
  includeDetails: boolean,
): Promise<TheoreticalPermissionResult> => {
  try {
    await assertWatchableArn(arn);
  } catch (err) {
    // A watched ARN can be absent from the catalogue (deleted from AWS after
    // being watched, or garbage predating validation) — get_permission_status
    // still serves its stored verdict, so explain the asymmetry instead of
    // leaving the user with a bare rejection. The lookup itself must never
    // replace the informative validation error, hence the catch-to-false.
    if (err instanceof DomainError && (await isArnWatched(ctx, arn).catch(() => false))) {
      throw new DomainError(
        `${err.message} Note: this ARN is on your watchlist — it may have been deleted from AWS after being watched; get_permission_status still shows its last stored verdict.`,
      );
    }
    throw err;
  }
  const warnings = await unknownActionWarnings(arn, [action]);

  const redis = await crawlerCache();
  // Divergence trade-off vs the logic service: logic derives this fallback from
  // the first watched-resource ARN with an account segment, we use the target
  // ARN's. Identical for the S3-only catalogue (account segment always empty);
  // can differ once multi-account IAM/SSO resources are crawled — revisit then.
  const accountFromArn = arn.split(":")[4] || "";
  const subject = await buildEvaluationSubject(redis, ctx.linkedAwsUserId, accountFromArn);
  if (!subject) {
    throw new DomainError(
      `No crawled identity data for your linked AWS user (${ctx.linkedAwsUserId}). The evaluator covers SSO users the crawlers have synced — IAM-linked users are not evaluated yet, and freshly linked SSO users appear after the next crawl cycle.`,
    );
  }

  const results = await evaluateResourceActions(redis, arn, [action], subject);
  const result = results[action]!;

  const watched = await isArnWatched(ctx, arn);

  return {
    arn,
    action,
    status: result.allowed ? "valid" : "error",
    allowed: result.allowed,
    reason: result.reason,
    watched,
    evaluatedAt: new Date().toISOString(),
    ...(warnings.length > 0 ? { warnings } : {}),
    ...(includeDetails ? { details: { context: result.context, steps: result.steps } } : {}),
  };
};
