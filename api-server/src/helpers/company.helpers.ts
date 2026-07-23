/** Generates a random 6-digit numeric invite code. */
export function generateInviteCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

/** Converts a company name to a URL-safe slug suggestion. */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
