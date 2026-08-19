import { MONO_LABEL_FONT_SIZE } from "@/constants";
import { spotlightOverlayStyles } from "@/components/spotlightCard/components/spotlightCard.styled";
import { getTagStyles } from "@/components/statusTag/helpers/statusTag.helpers";
import type { StatusTagVariant } from "@/components/statusTag/types/statusTag.types";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

export const CardRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // `100%` rather than the `stretch` keyword: Safari resolves `stretch` and
  // blew the card up to the full viewport, while Chrome dropped it to `auto`.
  height: "100%",
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  ...spotlightOverlayStyles(theme),
}));

export const CardBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  gap: theme.spacing(4),
  padding: theme.spacing(4),
}));

export const CardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "start",
  gap: theme.spacing(3),
}));

export const ServiceMeta = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  flex: 1,
  minWidth: 0,
}));

export const MetaTopRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

export const ResourceList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  gap: theme.spacing(1),
}));

export const ResourceItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const ResourceDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "dotColor",
})<{ dotColor: string }>(({ dotColor }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: dotColor,
  flexShrink: 0,
}));

export const MoreActionsPopoverContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(4),
  minWidth: 200,
  maxWidth: 320,
}));

export const ErrorDivider = styled(Divider)(({ theme }) => ({
  borderColor: theme.palette.text.secondary,
}));

export const ResourceArnRow = styled("span")(({ theme }) => ({
  display: "flex",
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: MONO_LABEL_FONT_SIZE,
  color: theme.palette.text.disabled,
  overflow: "hidden",
}));

// The prefix gives up space first; the resource itself is what identifies the row.
export const ArnHead = styled("span")({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const ArnTail = styled("span")({
  flexShrink: 0,
  maxWidth: "70%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

// Colours come from the tag palette, so the footer can never disagree with the tag above it.
export const StatusFooter = styled(Box, {
  shouldForwardProp: (prop) => prop !== "footerVariant",
})<{ footerVariant: StatusTagVariant }>(({ theme, footerVariant }) => {
  const styles = getTagStyles(theme.palette, footerVariant);

  return {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    minWidth: 0,
    padding: theme.spacing(2, 3),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${styles.border}`,
    backgroundColor: styles.bg,
    color: styles.color,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
  };
});

export const StatusFooterMessage = styled("span")({
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
