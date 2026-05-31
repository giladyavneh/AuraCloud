export const SIDEBAR_WIDTH = 260;

/**
 * Base URL of the api-server.
 * Set via `VITE_API_BASE_URL` in `frontend/.env` (or per-environment `.env.{mode}` files).
 * Falls back to localhost for local dev when the env var is not set.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const WATCHLIST_DOWNLOAD_FILENAME = 'watchlist.json';

export const CLOUDFORMATION_URL =
  'https://eu-central-1.console.aws.amazon.com/cloudformation/home?region=eu-central-1#/stacks/quickcreate?templateURL=https://aura-public-templates.s3.eu-central-1.amazonaws.com/aura-onboarding.yaml&stackName=Aura-SaaS-Onboarding';
