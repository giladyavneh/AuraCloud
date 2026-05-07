import "dotenv/config";
import { connectMongo, getRedisClient, mongoose } from "utils";
import { checkS3AccessForIamUser, checkS3AccessForSsoUser } from "./s3Access.js";

async function main() {
    await connectMongo();
    await getRedisClient();
    console.log("🚀 AuraCloud: Logic Service Initiated");

    const userId = process.argv[2] ?? "123";

    console.log(`\n--- IAM access for userId=${userId} ---`);
    console.log(JSON.stringify(await checkS3AccessForIamUser(userId), null, 2));

    console.log(`\n--- SSO access for userId=${userId} ---`);
    console.log(JSON.stringify(await checkS3AccessForSsoUser(userId), null, 2));

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
