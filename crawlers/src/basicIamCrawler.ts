import { IAMClient, ListRolesCommand, ListGroupsCommand, ListUsersCommand } from "@aws-sdk/client-iam";
import { BaseCrawler } from "./crawlerBase.js";
function print(obj: any){
    console.log(JSON.stringify(obj, null, 2));
}
export class BasicIamCrawler extends BaseCrawler {
    protected intervalMs = 1000;
    protected region = "eu-central-1";
    protected iamClient = new IAMClient({ region: this.region });

    async crawl() {
        const [users, roles, groups] = await Promise.all([
            this.iamClient.send(new ListUsersCommand({})),
            this.iamClient.send(new ListRolesCommand({})),
            this.iamClient.send(new ListGroupsCommand({}))
        ]);

        print({ users, roles, groups });
    }
}

new BasicIamCrawler().crawl();