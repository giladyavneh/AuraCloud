import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;

export const JWT_SECRET = process.env.JWT_SECRET ?? "aura-dev-secret-change-in-production";

export const BCRYPT_ROUNDS = 10;

/** Internal Aura infrastructure identities — never exposed as linkable AWS users. */
export const INTERNAL_AWS_USER_ARNS = [
  "arn:aws:iam::589523296424:user/Aura-Crawlers-Sevice",
  "arn:aws:iam::589523296424:user/Aura-SaaS-Crawler",
];
