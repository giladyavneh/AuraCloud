import { DescribePermissionSetCommand, ListAccountAssignmentsCommand, ListAccountAssignmentsForPrincipalCommand, ListInstancesCommand, ListPermissionSetsCommand, SSOAdminClient, type AccountAssignmentForPrincipal } from "@aws-sdk/client-sso-admin";
import { BaseCrawler } from "./crawlerBase.js";
import { IdentitystoreClient, ListGroupMembershipsCommand, ListGroupMembershipsForMemberCommand, ListGroupsCommand, ListUsersCommand, type Group, type GroupMembership, type User } from "@aws-sdk/client-identitystore";

export class SsoCrawler extends BaseCrawler {
    protected region = "eu-central-1";
    protected intervalMs = 5000;
    protected ssoAdminClient = new SSOAdminClient({ region: this.region });
    protected identityStoreClient = new IdentitystoreClient({ region: this.region });

    private async getSsoUsers(identityStoreId: string): Promise<User[]> {
    const res: User[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.callAndHandleThrotteling(() => this.identityStoreClient.send(
        new ListUsersCommand({
          IdentityStoreId: identityStoreId,
          NextToken: nextToken
        })
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
        new ListGroupsCommand({
          IdentityStoreId: identityStoreId,
          NextToken: nextToken
        })
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
              MemberId: {UserId: userId},
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

    async crawl() {
        const { Instances } = await this.callAndHandleThrotteling(() => this.ssoAdminClient.send(new ListInstancesCommand({})));
        const data: any = {users:  [], groups: [], permissionSets: []};

        for (const instance of Instances || []) {
            const identityStoreId = instance.IdentityStoreId!;
            const [Users, Groups] = await Promise.all([
                this.getSsoUsers(identityStoreId),
                this.getSsoGroups(identityStoreId)
            ]);

            for (const user of Users || []) {
                const memberships = await this.getGroupMembershipsForMember(identityStoreId, user.UserId!);
                (user as any).GroupMemberships = (memberships?.map(membership=> membership.GroupId) || []);
                const permissionSets = await this.getPermissionSetsForUser(instance.InstanceArn!, user.UserId!);
                (user as any).PermissionSets = permissionSets || [];
            }

            for (const group of Groups || []) {
                const permissionSets = await this.getPermissionSetsForGroup(instance.InstanceArn!, group.GroupId!);
                (group as any).PermissionSets = permissionSets || [];
            }

            const instanceArn = instance.InstanceArn!;
            const { PermissionSets } = await this.callAndHandleThrotteling(() => this.ssoAdminClient.send(new ListPermissionSetsCommand({
                InstanceArn: instance.InstanceArn!
            })));

            if (PermissionSets) {
                for (const psArn of PermissionSets) {
                    const { PermissionSet: describedPermissions } = await this.callAndHandleThrotteling(() => this.ssoAdminClient.send(new DescribePermissionSetCommand({
                        InstanceArn: instanceArn,
                        PermissionSetArn: psArn
                    })));  
                    data.permissionSets.push(describedPermissions);
                }
            }

            data.users.push(...(Users || []));
            data.groups.push(...(Groups || []));
        }
        return data;
    }

    async save(redis: any, data: any) {
        for (const user of data.users) await redis.hSet("aura:sso:users", user.UserId, JSON.stringify(user));
        for (const group of data.groups) await redis.hSet("aura:sso:groups", group.GroupId, JSON.stringify(group));
        for (const ps of data.permissionSets) await redis.hSet("aura:sso:permission-sets", ps.PermissionSetArn, JSON.stringify(ps));
        console.log(`💾 SSO Cache Updated: ${data.users.length} Users, ${data.groups.length} Groups`);
    }
}
