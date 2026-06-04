import {
  IAMClient, ListUsersCommand, ListRolesCommand, ListGroupsCommand,
  ListGroupsForUserCommand, ListAttachedUserPoliciesCommand,
  ListAttachedGroupPoliciesCommand, ListGroupPoliciesCommand,
  type User, type Role, type Group
} from "@aws-sdk/client-iam";
import { BaseCrawler } from "./crawlerBase.js";
import { AwsResourceModel } from "utils";

export class BasicIamCrawler extends BaseCrawler {
    public intervalMs = 1000;
    protected iamClient = new IAMClient({ region: this.region, credentials: this.credentials });

    private async fetchUsers(): Promise<User[]> {
        const res: User[] = [];
        let marker: string | undefined;
        do {
            const response = await this.callAndHandleThrotteling(() => this.iamClient.send(new ListUsersCommand({ Marker: marker })));
            res.push(...(response.Users || []));
            marker = response.Marker;
        } while (marker);
        return res;
    }

    private async fetchRoles(): Promise<Role[]> {
        const res: Role[] = [];
        let marker: string | undefined;
        do {
            const response = await this.callAndHandleThrotteling(() => this.iamClient.send(new ListRolesCommand({ Marker: marker })));
            res.push(...(response.Roles || []));
            marker = response.Marker;
        } while (marker);
        return res;
    }

    private async fetchGroups(): Promise<Group[]> {
        const res: Group[] = [];
        let marker: string | undefined;
        do {
            const response = await this.callAndHandleThrotteling(() => this.iamClient.send(new ListGroupsCommand({ Marker: marker })));
            res.push(...(response.Groups || []));
            marker = response.Marker;
        } while (marker);
        return res;
    }

    async crawl() {
        const [users, roles, groups] = await Promise.all([
            this.fetchUsers(), 
            this.fetchRoles(),
            this.fetchGroups()
        ]);

        // 1. Enrich Users (Who are they and what groups do they belong to?)
        const enrichedUsers = [];
        for (const user of users) {
            const [g, p] = await Promise.all([
                this.iamClient.send(new ListGroupsForUserCommand({ UserName: user.UserName })),
                this.iamClient.send(new ListAttachedUserPoliciesCommand({ UserName: user.UserName }))
            ]);
            enrichedUsers.push({ 
                ...user, 
                Groups: g.Groups?.map(x => x.GroupName), 
                AttachedPolicies: p.AttachedPolicies 
            });
        }

        // 2. Enrich Groups (What permissions does each group actually have?)
        const enrichedGroups = [];
        for (const group of groups) {
            const [attached, inline] = await Promise.all([
                this.iamClient.send(new ListAttachedGroupPoliciesCommand({ GroupName: group.GroupName })),
                this.iamClient.send(new ListGroupPoliciesCommand({ GroupName: group.GroupName }))
            ]);
            enrichedGroups.push({
                ...group,
                AttachedPolicies: attached.AttachedPolicies,
                InlinePolicyNames: inline.PolicyNames
            });
        }

        return { users: enrichedUsers, roles, groups: enrichedGroups };
    }

    async save(redis: any, data: any) {
        for (const user of data.users) await redis.hSet("aura:iam:users", user.UserName, JSON.stringify(user));
        for (const role of data.roles) await redis.hSet("aura:iam:roles", role.RoleName, JSON.stringify(role));
        for (const group of data.groups) await redis.hSet("aura:iam:groups", group.GroupName, JSON.stringify(group));
    }

    async saveToMongo(data: unknown) {
        const { users, roles, groups } = data as { users: any[]; roles: any[]; groups: any[] };
        const now = new Date();

        for (const user of users) {
            const arn = user.Arn;
            if (!arn) continue;
            await AwsResourceModel.findOneAndUpdate(
                { arn },
                {
                    arn,
                    resourceType: 'IAMUser',
                    name: user.UserName,
                    accountId: this.accountId,
                    metadata: { groups: user.Groups, attachedPolicies: user.AttachedPolicies },
                    lastSyncedAt: now,
                },
                { upsert: true, returnDocument: 'after' },
            );
        }

        for (const role of roles) {
            const arn = role.Arn;
            if (!arn) continue;
            await AwsResourceModel.findOneAndUpdate(
                { arn },
                {
                    arn,
                    resourceType: 'IAMRole',
                    name: role.RoleName,
                    accountId: this.accountId,
                    metadata: { assumeRolePolicyDocument: role.AssumeRolePolicyDocument },
                    lastSyncedAt: now,
                },
                { upsert: true, returnDocument: 'after' },
            );
        }

        for (const group of groups) {
            const arn = group.Arn;
            if (!arn) continue;
            await AwsResourceModel.findOneAndUpdate(
                { arn },
                {
                    arn,
                    resourceType: 'IAMGroup',
                    name: group.GroupName,
                    accountId: this.accountId,
                    metadata: { attachedPolicies: group.AttachedPolicies, inlinePolicyNames: group.InlinePolicyNames },
                    lastSyncedAt: now,
                },
                { upsert: true, returnDocument: 'after' },
            );
        }

    }
}