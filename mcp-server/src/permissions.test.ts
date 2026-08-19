import { beforeEach, describe, expect, it, vi } from "vitest";

const findOne = vi.fn();
const getWatchlist = vi.fn();

vi.mock("utils", async (importActual) => {
  const actual = await importActual<typeof import("utils")>();
  return { ...actual, UserPermissionModel: { findOne } };
});

vi.mock("./watchlist.js", () => ({ getWatchlist }));

const { getPermissionStatus } = await import("./permissions.js");

const ctx = { linkedAwsUserId: "AIDAEXAMPLE" } as Parameters<typeof getPermissionStatus>[0];

const WATCHED = "arn:aws:s3:::watched-bucket";
const NEVER_REPORTED = "arn:aws:s3:::never-reported";

const fresh = () => new Date().toISOString();
const longAgo = () => new Date(Date.now() - 3_600_000).toISOString();

const givenStoredPermissions = (permissionsData: Record<string, unknown> | null) => {
  findOne.mockReturnValue({
    lean: () => ({ exec: async () => (permissionsData ? { name: "dev", permissionsData } : null) }),
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  getWatchlist.mockResolvedValue({
    resources: [
      { arn: WATCHED, actions: [], name: "prod-db-server" },
      { arn: NEVER_REPORTED, actions: [] },
    ],
  });
});

describe("getPermissionStatus", () => {
  it("reports a watched resource the logic service never evaluated", async () => {
    givenStoredPermissions({
      [WATCHED]: { "s3:GetObject": { status: "valid", timestamp: fresh() } },
    });

    const result = await getPermissionStatus(ctx, {});

    expect(result.resources?.map(({ arn, status }) => ({ arn, status }))).toEqual([
      { arn: WATCHED, status: "healthy" },
      { arn: NEVER_REPORTED, status: "unscanned" },
    ]);
    expect(result.summary?.resourceStatus).toEqual({
      healthy: 1,
      blocked: 0,
      stale: 0,
      unscanned: 1,
    });
  });

  it("resolves an old evaluation as stale even when its verdict was an error", async () => {
    givenStoredPermissions({
      [WATCHED]: { "s3:GetObject": { status: "error", reason: "denied", timestamp: longAgo() } },
    });

    const result = await getPermissionStatus(ctx, {});

    expect(result.resources?.find((resource) => resource.arn === WATCHED)?.status).toBe("stale");
  });

  it("keeps the summary across the whole watchlist while filtering the returned resources", async () => {
    givenStoredPermissions({
      [WATCHED]: { "s3:GetObject": { status: "error", reason: "denied", timestamp: fresh() } },
    });

    const result = await getPermissionStatus(ctx, { arn: WATCHED });

    expect(result.resources).toHaveLength(1);
    expect(result.summary?.resources).toBe(2);
    expect(result.summary?.resourceStatus.unscanned).toBe(1);
  });

  it("still answers when the logic service has produced nothing at all", async () => {
    givenStoredPermissions(null);

    const result = await getPermissionStatus(ctx, {});

    expect(result.exists).toBe(true);
    expect(result.summary?.resourceStatus.unscanned).toBe(2);
    expect(result.message).toContain("logic service");
  });

  it("reports an empty watchlist as nothing to evaluate", async () => {
    getWatchlist.mockResolvedValue({ resources: [] });
    givenStoredPermissions(null);

    const result = await getPermissionStatus(ctx, {});

    expect(result.exists).toBe(false);
    expect(result.message).toContain("watchlist is empty");
  });

  it("carries the dashboard display name, and omits it when the catalogue has none", async () => {
    givenStoredPermissions({
      [WATCHED]: { "s3:GetObject": { status: "valid", timestamp: fresh() } },
    });

    const result = await getPermissionStatus(ctx, {});

    expect(result.resources?.find((resource) => resource.arn === WATCHED)?.name).toBe(
      "prod-db-server",
    );
    expect(result.resources?.find((resource) => resource.arn === NEVER_REPORTED)).not.toHaveProperty(
      "name",
    );
  });
});
