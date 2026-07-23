import { SPOTLIGHT_TINT_ALPHA } from "@/constants";
import Box from "@mui/material/Box";
import { alpha, styled, type CSSObject, type Theme } from "@mui/material/styles";

/**
 * Cursor-following spotlight overlay.
 *
 * Exported on its own so cards that already own their border, background and
 * radius (StatCard, ResourceCard) can opt into the effect without nesting an
 * extra SpotlightCardRoot around themselves and doubling up those borders.
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

// Standalone spotlight card — supplies its own surface, used by GlowCard.
export const SpotlightCardRoot = styled(Box)(({ theme }) => ({
  borderRadius: (theme.shape.borderRadius as number) * 2,
  border: `1px solid ${theme.palette.border.default}`,
  backgroundColor: theme.palette.surface.base,
  padding: theme.spacing(6),
  overflow: "hidden",
  ...spotlightOverlayStyles(theme),
}));
