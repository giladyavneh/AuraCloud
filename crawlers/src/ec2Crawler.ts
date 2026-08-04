import { BaseCrawler } from "./crawlerBase.js";
import { AwsResourceModel, print, ResourceActionModel } from "utils";
import { extractActionsFromPolicyDocument } from "./utils.js";
import extend from "extend";
import { ConfigServiceClient, GetResourceConfigHistoryCommand } from "@aws-sdk/client-config-service";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";

const GLOBAL_S3_REGION = "us-east-1";

export class EC2Crawler extends BaseCrawler {
    private ec2Client = new EC2Client({ region: 'eu-north-1', credentials: this.credentials });

    async crawl() {
        // list all ec2 instances
        const instances = await this.callAndHandleThrotteling(() => this.ec2Client.send(new DescribeInstancesCommand({})));
        print(instances);
        return instances;
    }
    
    async save(redis: any, data: any) {
    }
}
