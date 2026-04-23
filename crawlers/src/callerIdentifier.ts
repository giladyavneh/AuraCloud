import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

export async function identifyCaller() {
    const sts = new STSClient({ region: "eu-central-1" });
    const callerIdentity = await sts.send(new GetCallerIdentityCommand({}));
    console.log(JSON.stringify({callerIdentity}, null, 2));
    return callerIdentity;
}
