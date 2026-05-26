import Box from "@mui/material/Box";
import { alpha, styled } from "@mui/material/styles";

// Outer card with a cursor-following spotlight overlay.
// Source adapted from reactbits.dev (Spotlight Card). CSS variables drive the
// pseudo-element position; the React component updates them on mouse move.
export const SpotlightCardRoot = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: (theme.shape.borderRadius as number) * 2,
  border: `1px solid ${theme.palette.border.default}`,
  backgroundColor: theme.palette.surface.base,
  padding: theme.spacing(6),
  overflow: "hidden",

  // CSS variables read by the spotlight pseudo-element
  "--mouse-x": "50%",
  "--mouse-y": "50%",
  "--spotlight-color": alpha(theme.palette.primary.main, 0.15),

  // The radial spotlight follows the cursor and fades in on hover/focus
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
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
}));
