import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;

// No default secret: a shared fallback would let anyone forge tokens across environments.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required but was not set");
}

export const JWT_SECRET: string = process.env.JWT_SECRET;

export const BCRYPT_ROUNDS = 10;

/** Internal Aura infrastructure identities — never exposed as linkable AWS users. */
export const INTERNAL_AWS_USER_ARNS = [
  "arn:aws:iam::589523296424:user/Aura-Crawlers-Sevice",
  "arn:aws:iam::589523296424:user/Aura-SaaS-Crawler",
];
