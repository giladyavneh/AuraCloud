import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";

export const PageRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(6),
  height: "100%",
  overflow: "auto",
}));

export const PageHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(4),
}));

export const PageTitleBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const LeftPanel = styled(Box)(({ theme }) => ({
  height: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const PanelCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const JsonPanelCard = styled(Card)(({ theme }) => ({
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  overflow: "hidden",
}));

export const EmptyStateBanner = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(8, 4),
  border: `1px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

/** Empty state shown inside the table panel card when no resources are added yet */
export const PanelEmptyState = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(2),
  paddingBlock: theme.spacing(6),
  paddingInline: theme.spacing(4),
}));

export const FormRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  alignItems: "flex-start",
  flexWrap: "wrap",
}));

export const EditorPanelHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const EditorButtonGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const EditorWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  border: `1px solid ${theme.palette.border.default}`,
}));

export const JsonErrorBadge = styled(Box)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: theme.typography.caption.fontSize,
}));
