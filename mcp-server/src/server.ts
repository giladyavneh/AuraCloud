import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { UserContext } from "./identity.js";
import {
  DomainError,
  addResource,
  getWatchlist,
  removeResource,
  updateResourceActions,
} from "./watchlist.js";
import { getResourceActions, listAwsResources } from "./resources.js";
import { getPermissionStatus } from "./permissions.js";

const ok = (data: unknown): CallToolResult => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const fail = (message: string): CallToolResult => ({
  isError: true,
  content: [{ type: "text" as const, text: message }],
});

const handleError = (err: unknown): CallToolResult => {
  if (err instanceof DomainError) return fail(err.message);
  return fail(`Internal error: ${err instanceof Error ? err.message : String(err)}`);
};

export const buildServer = (ctx: UserContext): McpServer => {
  const server = new McpServer({ name: "auracloud-mcp-server", version: "1.0.0" });

  // SDK 1.29 rejects tools/call when the spec-optional `arguments` field is omitted
  // (it feeds `undefined` to the zod object schema), which breaks bare calls to
  // all-optional tools like get_permission_status. Normalize omitted arguments to {}.
  // validateToolInput is private in the SDK typings (hence the cast); if a future SDK
  // renames it, the guard skips the shim and behavior falls back to the SDK default.
  const internals = server as unknown as {
    validateToolInput?: (tool: unknown, args: unknown, toolName: string) => Promise<unknown>;
  };
  if (typeof internals.validateToolInput === "function") {
    const originalValidate = internals.validateToolInput.bind(server);
    internals.validateToolInput = (tool, args, toolName) =>
      originalValidate(tool, args ?? {}, toolName);
  }

  server.registerTool(
    "get_watchlist",
    {
      title: "Get watchlist",
      description:
        "Get the current AWS resource watchlist for the configured AuraCloud user (the resources and IAM actions being monitored). Use this first to see what is already monitored before adding, removing, or updating resources.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const watchlist = await getWatchlist(ctx);
        if (!watchlist) {
          return ok({ exists: false, userId: ctx.linkedAwsUserId, resources: [] });
        }
        return ok({
          exists: true,
          name: watchlist.name,
          userId: watchlist.userId,
          resources: watchlist.resources,
        });
      } catch (err) {
        return handleError(err);
      }
    },
  );

  server.registerTool(
    "get_permission_status",
    {
      title: "Get permission status",
      description:
        "Get Aura's evaluated permission status for the user's watched AWS resources: allowed ('valid') or blocked ('error') per IAM action, with the exact deny reason. This is the primary diagnostic tool — when the user reports an AWS operation failing (access denied, timeouts, silent failures), call this to determine whether cloud configuration is the cause. The summary always reflects the full watchlist even when filters are applied. Set includeDetails to true for the full policy evaluation trace (identity/resource/SCP steps and context keys).",
      inputSchema: {
        arn: z
          .string()
          .optional()
          .describe("Filter to a single watched resource by its full ARN (exact, case-sensitive — use the ARN as returned by get_watchlist)"),
        action: z
          .string()
          .optional()
          .describe("Filter to one IAM action, e.g. s3:GetObject (service prefix optional)"),
        status: z
          .enum(["valid", "error"])
          .optional()
          .describe("Return only actions with this status — 'error' means blocked"),
        includeDetails: z
          .boolean()
          .default(false)
          .describe("Include the full policy evaluation trace and evaluation timestamp per action. The trace is verbose — combine with an arn/action/status filter to keep the response small"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ arn, action, status, includeDetails }) => {
      try {
        return ok(await getPermissionStatus(ctx, { arn, action, status, includeDetails }));
      } catch (err) {
        return handleError(err);
      }
    },
  );

  server.registerTool(
    "add_watchlist_resource",
    {
      title: "Add watchlist resource",
      description:
        "Add an AWS resource (by ARN) to the user's monitoring watchlist, optionally with the IAM actions to monitor on it. Use this when the user wants to start monitoring a resource that is not on the watchlist yet; it creates the watchlist automatically if none exists. The ARN must be one of the discovered resources — find the exact ARN with list_aws_resources first (unknown ARNs are rejected, with a suggestion when a close match exists). Fails if the ARN is already watched — use update_resource_actions in that case.",
      inputSchema: {
        arn: z.string().describe("Full AWS ARN of the resource to watch, exactly as returned by list_aws_resources"),
        actions: z
          .array(z.string())
          .default([])
          .describe("IAM action names to monitor, e.g. s3:GetObject"),
      },
    },
    async ({ arn, actions }) => {
      try {
        return ok(await addResource(ctx, arn, actions));
      } catch (err) {
        return handleError(err);
      }
    },
  );

  server.registerTool(
    "remove_watchlist_resource",
    {
      title: "Remove watchlist resource",
      description:
        "Remove an AWS resource (by ARN) from the user's monitoring watchlist. Use this when the user no longer wants a resource monitored. Fails if the ARN is not currently on the watchlist.",
      inputSchema: {
        arn: z.string().describe("ARN to remove from the watchlist"),
      },
    },
    async ({ arn }) => {
      try {
        return ok(await removeResource(ctx, arn));
      } catch (err) {
        return handleError(err);
      }
    },
  );

  server.registerTool(
    "update_resource_actions",
    {
      title: "Update resource actions",
      description:
        "Replace the list of monitored IAM actions for a resource that is already on the watchlist. Use this to change which actions are monitored (the provided array fully replaces the existing one). Action names not present in the known-actions catalogue are accepted but flagged in a warnings array. Fails if the ARN is not on the watchlist — use add_watchlist_resource first.",
      inputSchema: {
        arn: z.string().describe("ARN of the watched resource to update"),
        actions: z
          .array(z.string())
          .describe("Replaces the resource's full actions array"),
      },
    },
    async ({ arn, actions }) => {
      try {
        return ok(await updateResourceActions(ctx, arn, actions));
      } catch (err) {
        return handleError(err);
      }
    },
  );

  server.registerTool(
    "list_aws_resources",
    {
      title: "List AWS resources",
      description:
        "List AWS resources discovered in the connected AWS account (ARN, type, name, account, region). Use this to find a resource's exact ARN before adding it to the watchlist, or to explore what exists in the account. Optionally filter by resourceType.",
      inputSchema: {
        resourceType: z
          .string()
          .optional()
          .describe("Filter by resource type, e.g. S3Bucket, IAMUser, IAMRole, IAMGroup, SSOUser, SSOGroup, PermissionSet"),
        nameContains: z
          .string()
          .optional()
          .describe("Case-insensitive substring match on the resource name — use this to resolve a human name like 'payments' to its exact ARN"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .default(100)
          .describe("Maximum number of resources to return"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ resourceType, nameContains, limit }) => {
      try {
        return ok(await listAwsResources({ resourceType, nameContains, limit }));
      } catch (err) {
        return handleError(err);
      }
    },
  );

  server.registerTool(
    "get_resource_actions",
    {
      title: "Get resource actions",
      description:
        "Get the IAM actions available for a discovered AWS resource (by ARN), derived from the policies attached to its service. Use this to see which actions can be monitored on a resource before adding it to the watchlist or updating its actions.",
      inputSchema: {
        arn: z.string().describe("ARN of a discovered AWS resource"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ arn }) => {
      try {
        return ok(await getResourceActions(arn));
      } catch (err) {
        return handleError(err);
      }
    },
  );

  return server;
};
