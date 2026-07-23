import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import { styled } from '@mui/material/styles';

export const PageRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(6),
  height: '100%',
  overflow: 'auto',
}));

export const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

export const TabsRoot = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.border.default}`,
  minHeight: 0,

  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 2,
  },

  '& .MuiTab-root': {
    textTransform: 'none',
    minHeight: 0,
    paddingBlock: theme.spacing(2),
    paddingInline: theme.spacing(1),
    marginInlineEnd: theme.spacing(5),
    color: theme.palette.text.secondary,

    '&.Mui-selected': {
      color: theme.palette.text.primary,
    },
  },
}));

export const TabContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  flex: 1,
  minHeight: 0,
}));

/** Generic bordered card recipe, hand-copied per page like every other section card in the app. */
export const SectionCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

export const InviteToggleRow = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.border.default}`,
  color: theme.palette.text.primary,
  textAlign: 'left',

  '&:hover': {
    backgroundColor: theme.palette.surface.subtle,
  },
}));

export const LoadingBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  paddingBlock: theme.spacing(8),
}));

export const ErrorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  paddingBlock: theme.spacing(4),
}));

/** Full-width dashed empty-state card — same recipe as dashboard.styled.ts's EmptyStateCard. */
export const EmptyStateCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(4),
  padding: theme.spacing(10, 6),
  backgroundColor: 'transparent',
  border: `1px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
}));

export const TabHeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
}));

export const TeamsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: theme.spacing(4),
}));

export const TeamCardRoot = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const TeamCardHeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

export const TeamCardValue = styled('p')(({ theme }) => ({
  margin: 0,
  ...theme.typography.h4,
  fontFamily: theme.typography.fontFamily,
  color: theme.palette.text.primary,
}));

export const PresetEditorRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  flex: 1,
  minHeight: 0,
}));

export const EditorHeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const EditorSection = styled(SectionCard)(({ theme }) => ({
  gap: theme.spacing(3),
}));

export const StalenessNotice = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
}));

export const EditorActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: theme.spacing(2),
}));
