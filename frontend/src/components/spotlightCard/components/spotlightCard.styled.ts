import { SPOTLIGHT_TINT_ALPHA } from "@/constants";
import { alpha, type CSSObject, type Theme } from "@mui/material/styles";

/**
 * Cursor-following spotlight overlay.
 *
 * The CSS variables are written by `useSpotlight` on mouse move.
 */
export const spotlightOverlayStyles = (theme: Theme): CSSObject => ({
  position: "relative",

  // Defaults, overwritten per-element by useSpotlight
  "--mouse-x": "50%",
  "--mouse-y": "50%",
  "--spotlight-color": alpha(theme.palette.primary.main, SPOTLIGHT_TINT_ALPHA),

  // The radial spotlight follows the cursor and fades in on hover/focus.
  // `borderRadius: inherit` keeps the glow clipped to the host card's corners
  // even when the host does not set `overflow: hidden`.
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background:
      "radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 80%)",
    opacity: 0,
    transition: "opacity 0.5s ease",
    pointerEvents: "none",
    zIndex: 2,
  },

  "&:hover::before, &:focus-within::before": {
    opacity: 1,
  },

  "@media (prefers-reduced-motion: reduce)": {
    "&::before": {
      transition: "none",
    },
  },
});
