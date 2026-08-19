export const SIDEBAR_WIDTH = 260;

/** theme.spacing units of padding around routed page content. */
export const MAIN_CONTENT_PADDING = 6;

// UI constants
export const MONO_LABEL_FONT_SIZE = "11px";
export const INVITE_CODE_FONT_SIZE = "20px";
export const INVITE_CODE_LETTER_SPACING = "0.25em";
export const WATCHLIST_SEARCH_WIDTH = 320;
export const WATCHLIST_RESOURCE_SELECT_WIDTH = 280;
export const WATCHLIST_ACTIONS_SELECT_WIDTH = 320;
/** Selected action chips shown before collapsing to "+N" (while unfocused) */
export const WATCHLIST_ACTIONS_VISIBLE_TAGS = 2;
/** Fill and border opacity of the mono action chips in the blocked-actions popover */
export const ERROR_CHIP_FILL_ALPHA = 0.12;
export const ERROR_CHIP_BORDER_ALPHA = 0.4;

/** Opacity of the cursor-following spotlight tint on cards */
export const SPOTLIGHT_TINT_ALPHA = 0.15;
export const USER_LIST_MAX_HEIGHT = 280;
export const EDITOR_FONT_SIZE = 13;
export const EDITOR_PADDING = 12;

// Timing constants (ms)
export const COPY_FEEDBACK_DURATION_MS = 2000;
export const SLUG_DEBOUNCE_MS = 500;
export const ONBOARD_REDIRECT_DELAY_MS = 1500;

// External links / domain
export const AURA_CLOUD_DOMAIN = "https://aura-cloud.com";

/**
 * Base URL of the api-server.
 * Set via `VITE_API_BASE_URL` in `frontend/.env` (or per-environment `.env.{mode}` files).
 * Falls back to localhost for local dev when the env var is not set.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

/**
 * Where an AI client reaches the MCP server. Set via `VITE_MCP_SERVER_URL`, the same
 * way as API_BASE_URL — the install command carries no secret, so it is safe to bundle.
 */
export const MCP_SERVER_URL =
  import.meta.env.VITE_MCP_SERVER_URL ?? "http://localhost:3001/mcp";

export const MCP_INSTALL_COMMAND = `claude mcp add --transport http auracloud ${MCP_SERVER_URL}`;

export const WATCHLIST_DOWNLOAD_FILENAME = "watchlist.json";

export const CLOUDFORMATION_URL =
  "https://eu-central-1.console.aws.amazon.com/cloudformation/home?region=eu-central-1#/stacks/quickcreate?templateURL=https://aura-public-templates.s3.eu-central-1.amazonaws.com/aura-onboarding.yaml&stackName=Aura-SaaS-Onboarding";
