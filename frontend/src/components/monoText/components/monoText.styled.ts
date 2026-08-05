import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import type { ElementType } from "react";

/**
 * The install command and the row address. Dimmed renders the spoofable host prefix.
 * `component` is re-declared because styling a Typography drops its polymorphic prop.
 */
export const MonoText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isDimmed",
})<{ isDimmed?: boolean; component?: ElementType }>(({ theme, isDimmed }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  color: isDimmed ? theme.palette.text.disabled : theme.palette.text.primary,
  wordBreak: "break-all",
  flexGrow: 1,
}));
