import {
    DescribePermissionSetCommand,
    GetInlinePolicyForPermissionSetCommand,
    ListAccountAssignmentsForPrincipalCommand,
    ListCustomerManagedPolicyReferencesInPermissionSetCommand,
    ListInstancesCommand,
    ListManagedPoliciesInPermissionSetCommand,
    ListPermissionSetsCommand,
    SSOAdminClient,
    type AccountAssignmentForPrincipal
} from "@aws-sdk/client-sso-admin";
import { IAMClient } from "@aws-sdk/client-iam";
import { BaseCrawler } from "./crawlerBase.js";
import {
    IdentitystoreClient,
    ListGroupMembershipsForMemberCommand,
    ListGroupsCommand,
    ListUsersCommand,
    type Group,
    type GroupMembership,
    type User
} from "@aws-sdk/client-identitystore";
import { decodePolicyDoc, resolveManagedPolicies, type ManagedPolicyEntry } from "./managedPolicyResolver.js";

export class SsoCrawler extends BaseCrawler {
    protected region = "eu-central-1";
    protected intervalMs = 5000;
    protected ssoAdminClient = new SSOAdminClient({ region: this.region });
    protected identityStoreClient = new IdentitystoreClient({ region: this.region });
    protected iamClient = new IAMClient({ region: this.region });

    private async getSsoUsers(identityStoreId: string): Promise<User[]> {
        const res: User[] = [];
        let nextToken: string | undefined;
        do {
            const response = await this.callAndHandleThrotteling(() => this.identityStoreClient.send(
                new ListUsersCommand({ IdentityStoreId: identityStoreId, NextToken: nextToken })
            ));
            nextToken = response.NextToken;
            res.push(...(response.Users ?? []));
        } while (nextToken);
        return res;
    }

    async getSsoGroups(identityStoreId: string): Promise<Group[]> {
        const res: Group[] = [];
        let nextToken: string | undefined;
        do {
            const response = await this.callAndHandleThrotteling(() => this.identityStoreClient.send(
                new ListGroupsCommand({ IdentityStoreId: identityStoreId, NextToken: nextToken })
            ));
            nextToken = response.NextToken;
            res.push(...(response.Groups ?? []));
        } while (nextToken);
        return res;
    }

    private async getGroupMembershipsForMember(identityStoreId: string, userId: string): Promise<GroupMembership[]> {
        const res: GroupMembership[] = [];
        let nextToken: string | undefined;
        do {
            const response = await this.callAndHandleThrotteling(() => this.identityStoreClient.send(
                new ListGroupMembershipsForMemberCommand({
                    IdentityStoreId: identityStoreId,
                    MemberId: { UserId: userId },
                    NextToken: nextToken
                })
            ));
            nextToken = response.NextToken;
            res.push(...(response.GroupMemberships ?? []));
        } while (nextToken);
        return res;
    }

    private async getPermissionSetsForEntity(instanceArn: string, entityId: string, principalType: "USER" | "GROUP") {
        const res: AccountAssignmentForPrincipal[] = [];
        let nextToken: string | undefined;
        do {
            const response = await this.callAndHandleThrotteling(() => this.ssoAdminClient.send(new ListAccountAssignmentsForPrincipalCommand({
                InstanceArn: instanceArn,
                PrincipalId: entityId,
                PrincipalType: principalType,
                NextToken: nextToken
            })));
            nextToken = response.NextToken;
            res.push(...(response.AccountAssignments || []));
        } while (nextToken);
        return res;
    }

    private getPermissionSetsForUser(instanceArn: string, userId: string) {
        return this.getPermissionSetsForEntity(instanceArn, userId, "USER");
    }

    private getPermissionSetsForGroup(instanceArn: string, groupId: string) {
        return this.getPermissionSetsForEntity(instanceArn, groupId, "GROUP");
    }

    private async fetchPermissionSetPolicies(instanceArn: string, permissionSetArn: string) {
        const inlineResp = await this.callAndHandleThrotteling(() =>
            this.ssoAdminClient.send(new GetInlinePolicyForPermissionSetCommand({
                InstanceArn: instanceArn,
                PermissionSetArn: permissionSetArn,
            }))
        ).catch(() => null);
        const inlineDoc = decodePolicyDoc(inlineResp?.InlinePolicy);

        const managedArns: string[] = [];
        let nextToken: string | undefined;
        do {
            const resp = await this.callAndHandleThrotteling(() =>
                this.ssoAdminClient.send(new ListManagedPoliciesInPermissionSetCommand({
                    InstanceArn: instanceArn,
                    PermissionSetArn: permissionSetArn,
                    NextToken: nextToken,
                }))
            );
            for (const p of resp.AttachedManagedPolicies || []) {
                if (p.Arn) managedArns.push(p.Arn);
            }
            nextToken = resp.NextToken;
        } while (nextToken);

        const customerManagedRefs: { name: string; path?: string }[] = [];
        nextToken = undefined;
        do {
            const resp = await this.callAndHandleThrotteling(() =>
                this.ssoAdminClient.send(new ListCustomerManagedPolicyReferencesInPermissionSetCommand({
                    InstanceArn: instanceArn,
                    PermissionSetArn: permissionSetArn,
                    NextToken: nextToken,
                }))
            );
            for (const ref of resp.CustomerManagedPolicyReferences || []) {
                if (ref.Name) customerManagedRefs.push({ name: ref.Name, ...(ref.Path ? { path: ref.Path } : {}) });
            }
            nextToken = resp.NextToken;
        } while (nextToken);

        return { InlinePolicy: inlineDoc, ManagedPolicyArns: managedArns, CustomerManagedPolicyReferences: customerManagedRefs };
    }

    async crawl() {
        const { Instances } = await this.callAndHandleThrotteling(() => this.ssoAdminClient.send(new ListInstancesCommand({})));
        const data: any = { users: [], groups: [], permissionSets: [] };
        const managedPolicyArns = new Set<string>();

        for (const instance of Instances || []) {
            const identityStoreId = instance.IdentityStoreId!;
            const instanceArn = instance.InstanceArn!;
            const [Users, Groups] = await Promise.all([
                this.getSsoUsers(identityStoreId),
                this.getSsoGroups(identityStoreId)
            ]);

            for (const user of Users || []) {
                const memberships = await this.getGroupMembershipsForMember(identityStoreId, user.UserId!);
                (user as any).GroupMemberships = (memberships?.map(m => m.GroupId) || []);
                const permissionSets = await this.getPermissionSetsForUser(instanceArn, user.UserId!);
                (user as any).PermissionSets = permissionSets || [];
            }

            for (const group of Groups || []) {
                const permissionSets = await this.getPermissionSetsForGroup(instanceArn, group.GroupId!);
                (group as any).PermissionSets = permissionSets || [];
            }

            const { PermissionSets } = await this.callAndHandleThrotteling(() => this.ssoAdminClient.send(new ListPermissionSetsCommand({
                InstanceArn: instanceArn
            })));

            for (const psArn of PermissionSets || []) {
                const { PermissionSet: describedPermissions } = await this.callAndHandleThrotteling(() => this.ssoAdminClient.send(new DescribePermissionSetCommand({
                    InstanceArn: instanceArn,
                    PermissionSetArn: psArn
                })));
                const policies = await this.fetchPermissionSetPolicies(instanceArn, psArn);
                for (const arn of policies.ManagedPolicyArns) managedPolicyArns.add(arn);
                data.permissionSets.push({
                    ...describedPermissions,
                    InstanceArn: instanceArn,
                    ...policies,
                });
            }

            data.users.push(...(Users || []));
            data.groups.push(...(Groups || []));
        }

        data.managedPolicies = await resolveManagedPolicies(
            this.iamClient,
            managedPolicyArns,
            (fn) => this.callAndHandleThrotteling(fn),
        );

        return data;
    }

    async save(redis: any, data: any) {
        for (const user of data.users) await redis.hSet("aura:sso:users", user.UserId, JSON.stringify(user));
        for (const group of data.groups) await redis.hSet("aura:sso:groups", group.GroupId, JSON.stringify(group));
        for (const ps of data.permissionSets) await redis.hSet("aura:sso:permission-sets", ps.PermissionSetArn, JSON.stringify(ps));
        for (const [arn, entry] of Object.entries(data.managedPolicies as Record<string, ManagedPolicyEntry>)) {
            await redis.hSet("aura:iam:managed-policies", arn, JSON.stringify(entry));
        }
        console.log(`💾 SSO Cache Updated: ${data.users.length} Users, ${data.groups.length} Groups, ${data.permissionSets.length} PermissionSets`);
    }
}
