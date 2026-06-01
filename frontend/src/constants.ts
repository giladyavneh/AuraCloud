export const SIDEBAR_WIDTH = 260;

// UI constants
export const MONO_LABEL_FONT_SIZE = "11px";
export const INVITE_CODE_FONT_SIZE = "20px";
export const INVITE_CODE_LETTER_SPACING = "0.25em";
export const WATCHLIST_SEARCH_WIDTH = 260;
export const USER_LIST_MAX_HEIGHT = 280;
export const EDITOR_FONT_SIZE = 13;
export const EDITOR_PADDING = 12;

// Timing constants (ms)
export const COPY_FEEDBACK_DURATION_MS = 2000;
export const SLUG_DEBOUNCE_MS = 500;
export const ONBOARD_REDIRECT_DELAY_MS = 1500;

// External links / domain
export const AURA_CLOUD_DOMAIN = "aura-cloud.com";

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
