import { readJsonHash, readJsonHashAll, type RedisClient } from "./redisHelpers.js";
import { type PolicySource } from "./policyEvaluator.js";
import type { IdentityContext } from "./checks.js";

type ManagedPolicyEntry = { document: any };

function appendAttachmentSources(
    target: PolicySource[],
    attachedPolicies: any[] | undefined,
    inlinePolicies: any[] | undefined,
    managedPolicies: Record<string, ManagedPolicyEntry>,
    ownerLabel: string,
    notes: string[],
): void {
    for (const ap of attachedPolicies || []) {
        const arn: string | undefined = ap?.PolicyArn;
        if (!arn) continue;
        const entry = managedPolicies[arn];
        if (!entry?.document) {
            notes.push(`missing managed policy body for ${arn} (attached to ${ownerLabel})`);
            continue;
        }
        target.push({
            document: entry.document,
            origin: `identity:${ownerLabel}:${ap.PolicyName ?? arn}`,
            type: "identity",
        });
    }

    for (const inline of inlinePolicies || []) {
        if (!inline?.document) continue;
        target.push({
            document: inline.document,
            origin: `identity:${ownerLabel}:inline:${inline.name}`,
            type: "identity",
        });
    }
}

export async function loadIamIdentity(redis: RedisClient, name: string): Promise<IdentityContext> {
    const notes: string[] = [];
    const user = await readJsonHash<any>(redis, "aura:iam:users", name);
    if (!user) {
        return {
            kind: "iam",
            name,
            found: false,
            policySources: [],
            notes: [`IAM user "${name}" not found in aura:iam:users`],
        };
    }

    const managedPolicies = await readJsonHashAll<ManagedPolicyEntry>(redis, "aura:iam:managed-policies");
    const policySources: PolicySource[] = [];

    appendAttachmentSources(
        policySources,
        user.AttachedPolicies,
        user.InlinePolicies,
        managedPolicies,
        `user:${user.UserName}`,
        notes,
    );

    for (const groupName of user.Groups || []) {
        const group = await readJsonHash<any>(redis, "aura:iam:groups", groupName);
        if (!group) {
            notes.push(`group "${groupName}" not found in cache`);
            continue;
        }
        appendAttachmentSources(
            policySources,
            group.AttachedPolicies,
            group.InlinePolicies,
            managedPolicies,
            `group:${groupName}`,
            notes,
        );
    }

    return {
        kind: "iam",
        name,
        found: true,
        ...(user.Arn ? { principalArn: user.Arn } : {}),
        policySources,
        raw: user,
        notes,
    };
}

export async function loadSsoIdentity(redis: RedisClient, name: string): Promise<IdentityContext> {
    const notes: string[] = [];
    const ssoUsers = await readJsonHashAll<any>(redis, "aura:sso:users");
    const target = name.toLowerCase();
    const ssoUser = Object.values(ssoUsers).find(
        (u) =>
            u?.UserName?.toLowerCase() === target ||
            u?.DisplayName?.toLowerCase() === target,
    );

    if (!ssoUser) {
        return {
            kind: "sso",
            name,
            found: false,
            policySources: [],
            notes: [`SSO user "${name}" not found in aura:sso:users`],
        };
    }

    const ssoGroups = await readJsonHashAll<any>(redis, "aura:sso:groups");
    const permissionSets = await readJsonHashAll<any>(redis, "aura:sso:permission-sets");
    const managedPolicies = await readJsonHashAll<ManagedPolicyEntry>(redis, "aura:iam:managed-policies");

    const permissionSetArns = new Set<string>();
    for (const assignment of ssoUser.PermissionSets || []) {
        if (assignment?.PermissionSetArn) permissionSetArns.add(assignment.PermissionSetArn);
    }
    for (const groupId of ssoUser.GroupMemberships || []) {
        const group = ssoGroups[groupId];
        if (!group) {
            notes.push(`SSO group "${groupId}" not found in cache`);
            continue;
        }
        for (const assignment of group.PermissionSets || []) {
            if (assignment?.PermissionSetArn) permissionSetArns.add(assignment.PermissionSetArn);
        }
    }

    const policySources: PolicySource[] = [];
    for (const psArn of permissionSetArns) {
        const ps = permissionSets[psArn];
        if (!ps) {
            notes.push(`permission set "${psArn}" not found in cache`);
            continue;
        }
        const psName = ps.Name || psArn;
        if (ps.InlinePolicy && (ps.InlinePolicy as any).Statement) {
            policySources.push({
                document: ps.InlinePolicy,
                origin: `identity:permission-set:${psName}:inline`,
                type: "identity",
            });
        }
        for (const arn of ps.ManagedPolicyArns || []) {
            const entry = managedPolicies[arn];
            if (!entry?.document) {
                notes.push(`missing managed policy body for ${arn} (attached to permission set ${psName})`);
                continue;
            }
            policySources.push({
                document: entry.document,
                origin: `identity:permission-set:${psName}:${arn}`,
                type: "identity",
            });
        }
        for (const ref of ps.CustomerManagedPolicyReferences || []) {
            notes.push(`customer-managed policy "${ref.name}" on permission set ${psName} (body not in cache)`);
        }
    }

    return {
        kind: "sso",
        name,
        found: true,
        policySources,
        raw: ssoUser,
        notes,
    };
}
