import { DescribePermissionSetCommand, ListAccountAssignmentsCommand, ListAccountAssignmentsForPrincipalCommand, ListInstancesCommand, ListPermissionSetsCommand, SSOAdminClient } from "@aws-sdk/client-sso-admin";
import { BaseCrawler } from "./crawlerBase.js";
import { IdentitystoreClient, ListGroupMembershipsCommand, ListGroupMembershipsForMemberCommand, ListGroupsCommand, ListUsersCommand } from "@aws-sdk/client-identitystore";
function print(obj: any){
    console.log(JSON.stringify(obj, null, 2));
}
export class SsoCrawler extends BaseCrawler {
    protected region = "eu-central-1";
    protected intervalMs = 5000;
    protected ssoAdminClient = new SSOAdminClient({ region: this.region });
    protected identityStoreClient = new IdentitystoreClient({ region: this.region });

    private getSsoUsers(identityStoreId: string) {
        return this.identityStoreClient.send(new ListUsersCommand({
            IdentityStoreId: identityStoreId
        }));
    }
    
    private getSsoGroups(identityStoreId: string) {
        return this.identityStoreClient.send(new ListGroupsCommand({
            IdentityStoreId: identityStoreId
        }));
    }

    private getGroupMembershipsForMember(identityStoreId: string, userId: string) {
        return this.identityStoreClient.send(new ListGroupMembershipsForMemberCommand({
            IdentityStoreId: identityStoreId,
            MemberId: {UserId: userId}
        }));
    }

    private getPermissionSetsForEntity(instanceArn: string, entityId: string, principalType: "USER" | "GROUP") {
        return this.ssoAdminClient.send(new ListAccountAssignmentsForPrincipalCommand({
            InstanceArn: instanceArn,
            PrincipalId: entityId,
            PrincipalType: principalType
        }));
    }

    private getPermissionSetsForUser(instanceArn: string, userId: string) {
        return this.getPermissionSetsForEntity(instanceArn, userId, "USER");
    }

    private getPermissionSetsForGroup(instanceArn: string, groupId: string) {
        return this.getPermissionSetsForEntity(instanceArn, groupId, "GROUP");
    }

    async crawl() {
        const { Instances } = await this.ssoAdminClient.send(new ListInstancesCommand({}));
        const data: any = {users:  [], groups: [], permissionSets: []};

        for (const instance of Instances || []) {
            const identityStoreId = instance.IdentityStoreId!;
            const [{Users}, {Groups}] = await Promise.all([
                this.getSsoUsers(identityStoreId),
                this.getSsoGroups(identityStoreId)
            ]);

            for (const user of Users || []) {
                const memberships = await this.getGroupMembershipsForMember(identityStoreId, user.UserId!);
                (user as any).GroupMemberships = (memberships.GroupMemberships?.map(membership=> membership.GroupId) || []);
                const permissionSets = await this.getPermissionSetsForUser(instance.InstanceArn!, user.UserId!);
                (user as any).PermissionSets = permissionSets.AccountAssignments || [];
            }

            for (const group of Groups || []) {
                const permissionSets = await this.getPermissionSetsForGroup(instance.InstanceArn!, group.GroupId!);
                (group as any).PermissionSets = permissionSets.AccountAssignments || [];
            }

            const instanceArn = instance.InstanceArn!;
            const { PermissionSets } = await this.ssoAdminClient.send(new ListPermissionSetsCommand({
                InstanceArn: instance.InstanceArn!
            }));

            if (PermissionSets) {
                for (const psArn of PermissionSets) {
                    const { PermissionSet: describedPermissions } = await this.ssoAdminClient.send(new DescribePermissionSetCommand({
                        InstanceArn: instanceArn,
                        PermissionSetArn: psArn
                    }));  
                    data.permissionSets.push(describedPermissions);
                }
            }

            data.users.push(...(Users || []));
            data.groups.push(...(Groups || []));
        }
        return data;
    }
}

new SsoCrawler().crawl().then(data => print(data)).catch(err => console.error(err));