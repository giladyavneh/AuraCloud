import { describe, expect, test, beforeEach } from "vitest";
import { clearPolicyCache, getPolicyDocument, type RedisClientType } from "utils";

function mockRedis(hashes: Record<string, Record<string, string>>, hGetCalls: string[]): RedisClientType {
  return {
    hGet: async (hash: string, field: string) => {
      hGetCalls.push(`${hash}:${field}`);
      return hashes[hash]?.[field] ?? null;
    },
  } as unknown as RedisClientType;
}

describe("policy catalog LRU", () => {
  beforeEach(() => {
    clearPolicyCache();
  });

  test("reads Redis once for the same policy ARN", async () => {
    const hGetCalls: string[] = [];
    const redis = mockRedis(
      {
        "aura:iam:policies": {
          "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess": JSON.stringify({
            Document: { Statement: [{ Effect: "Allow", Action: "s3:Get*" }] },
          }),
        },
      },
      hGetCalls,
    );

    const first = await getPolicyDocument(redis, "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess");
    const second = await getPolicyDocument(redis, "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess");

    expect(first).toEqual({ Statement: [{ Effect: "Allow", Action: "s3:Get*" }] });
    expect(second).toBe(first);
    expect(hGetCalls).toEqual(["aura:iam:policies:arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"]);
  });
});
