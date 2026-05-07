import {
  IAMClient, ListUsersCommand, ListRolesCommand, ListGroupsCommand,
  ListGroupsForUserCommand, ListAttachedUserPoliciesCommand,
  ListAttachedGroupPoliciesCommand, ListGroupPoliciesCommand,
  ListUserPoliciesCommand, GetUserPolicyCommand, GetGroupPolicyCommand,
  type User, type Role, type Group
} from "@aws-sdk/client-iam";
import { BaseCrawler } from "./crawlerBase.js";
import { decodePolicyDoc, resolveManagedPolicies, type ManagedPolicyEntry } from "./managedPolicyResolver.js";

type InlinePolicy = { name: string; document: any };

export class BasicIamCrawler extends BaseCrawler {
  public intervalMs = 1000;
  protected iamClient = new IAMClient({ region: this.region });

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

  private async fetchUserInlinePolicies(userName: string): Promise<InlinePolicy[]> {
    const inline: InlinePolicy[] = [];
    let marker: string | undefined;
    do {
      const list = await this.callAndHandleThrotteling(() =>
        this.iamClient.send(new ListUserPoliciesCommand({ UserName: userName, Marker: marker }))
      );
      for (const name of list.PolicyNames || []) {
        const got = await this.callAndHandleThrotteling(() =>
          this.iamClient.send(new GetUserPolicyCommand({ UserName: userName, PolicyName: name }))
        ).catch(() => null);
        inline.push({ name, document: decodePolicyDoc(got?.PolicyDocument) });
      }
      marker = list.Marker;
    } while (marker);
    return inline;
  }

  private async fetchGroupInlinePolicies(groupName: string, names: string[]): Promise<InlinePolicy[]> {
    const inline: InlinePolicy[] = [];
    for (const name of names) {
      const got = await this.callAndHandleThrotteling(() =>
        this.iamClient.send(new GetGroupPolicyCommand({ GroupName: groupName, PolicyName: name }))
      ).catch(() => null);
      inline.push({ name, document: decodePolicyDoc(got?.PolicyDocument) });
    }
    return inline;
  }

  async crawl() {
    const [users, roles, groups] = await Promise.all([
      this.fetchUsers(),
      this.fetchRoles(),
      this.fetchGroups()
    ]);

    const managedPolicyArns = new Set<string>();

    const enrichedUsers = [];
    for (const user of users) {
      const userName = user.UserName!;
      const [g, p, inline] = await Promise.all([
        this.callAndHandleThrotteling(() => this.iamClient.send(new ListGroupsForUserCommand({ UserName: userName }))),
        this.callAndHandleThrotteling(() => this.iamClient.send(new ListAttachedUserPoliciesCommand({ UserName: userName }))),
        this.fetchUserInlinePolicies(userName),
      ]);
      for (const ap of p.AttachedPolicies || []) {
        if (ap.PolicyArn) managedPolicyArns.add(ap.PolicyArn);
      }
      enrichedUsers.push({
        ...user,
        Groups: g.Groups?.map(x => x.GroupName),
        AttachedPolicies: p.AttachedPolicies,
        InlinePolicies: inline,
      });
    }

    const enrichedGroups = [];
    for (const group of groups) {
      const groupName = group.GroupName!;
      const [attached, inlineList] = await Promise.all([
        this.callAndHandleThrotteling(() => this.iamClient.send(new ListAttachedGroupPoliciesCommand({ GroupName: groupName }))),
        this.callAndHandleThrotteling(() => this.iamClient.send(new ListGroupPoliciesCommand({ GroupName: groupName })))
      ]);
      for (const ap of attached.AttachedPolicies || []) {
        if (ap.PolicyArn) managedPolicyArns.add(ap.PolicyArn);
      }
      const inline = await this.fetchGroupInlinePolicies(groupName, inlineList.PolicyNames || []);
      enrichedGroups.push({
        ...group,
        AttachedPolicies: attached.AttachedPolicies,
        InlinePolicyNames: inlineList.PolicyNames,
        InlinePolicies: inline,
      });
    }

    const managedPolicies = await resolveManagedPolicies(
      this.iamClient,
      managedPolicyArns,
      (fn) => this.callAndHandleThrotteling(fn),
    );

    return { users: enrichedUsers, roles, groups: enrichedGroups, managedPolicies };
  }

  async save(redis: any, data: any) {
    for (const user of data.users) await redis.hSet("aura:iam:users", user.UserName, JSON.stringify(user));
    for (const role of data.roles) await redis.hSet("aura:iam:roles", role.RoleName, JSON.stringify(role));
    for (const group of data.groups) await redis.hSet("aura:iam:groups", group.GroupName, JSON.stringify(group));
    for (const [arn, entry] of Object.entries(data.managedPolicies as Record<string, ManagedPolicyEntry>)) {
      await redis.hSet("aura:iam:managed-policies", arn, JSON.stringify(entry));
    }
    console.log(
      `💾 IAM Cache Updated: ${data.users.length} Users, ${data.groups.length} Groups, ${data.roles.length} Roles, ${Object.keys(data.managedPolicies).length} Managed Policies`
    );
  }
}
