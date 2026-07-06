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
    "add_watchlist_resource",
    {
      title: "Add watchlist resource",
      description:
        "Add an AWS resource (by ARN) to the user's monitoring watchlist, optionally with the IAM actions to monitor on it. Use this when the user wants to start monitoring a resource that is not on the watchlist yet; it creates the watchlist automatically if none exists. Fails if the ARN is already watched — use update_resource_actions in that case.",
      inputSchema: {
        arn: z.string().describe("Full AWS ARN of the resource to watch"),
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
        "Replace the list of monitored IAM actions for a resource that is already on the watchlist. Use this to change which actions are monitored (the provided array fully replaces the existing one). Fails if the ARN is not on the watchlist — use add_watchlist_resource first.",
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
    async ({ resourceType, limit }) => {
      try {
        return ok(await listAwsResources({ resourceType, limit }));
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
