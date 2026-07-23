import { spotlightOverlayStyles } from '@/components/spotlightCard/components/spotlightCard.styled';
import ButtonBase from '@mui/material/ButtonBase';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, styled } from '@mui/material/styles';

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

// Accented, always-visible invite card at the top of the Employees tab. Uses the
// `border.glow` accent + spotlight overlay (the app's "elevated / worth noticing"
// treatment) so it reads as the page's entry point, not a nested container.
export const InviteCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.glow}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  ...spotlightOverlayStyles(theme),
}));

export const InviteHeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const InviteIconBadge = styled(Box)(({ theme }) => ({
  width: theme.spacing(8),
  height: theme.spacing(8),
  flexShrink: 0,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
}));

// Code + link presented as peers (pick either), collapsing to one column on narrow viewports.
export const InviteFieldsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(3),

  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: '1fr 1fr',
  },
}));

// Keeps the card from jumping height between the loading spinner and loaded content.
export const InviteLoadingBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: theme.spacing(20),
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

// Clickable name + chevron that toggles the member list. Sits on the left of the
// header row; the rename/delete actions stay outside it so they never toggle.
export const TeamCardExpandTrigger = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flex: 1,
  minWidth: 0,
  justifyContent: 'flex-start',
  borderRadius: theme.shape.borderRadius,
  textAlign: 'left',

  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));

export const TeamMembersPanelRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
  paddingTop: theme.spacing(3),
  borderTop: `1px solid ${theme.palette.border.default}`,
}));

export const TeamMemberRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

export const TeamPresetLine = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  paddingBlock: theme.spacing(1.5),
  paddingInline: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.surface.glow,
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

// Scope switch (Team / Individual) in the preset editor, styled to echo the
// dashboard FilterTabs: a bordered pill container with an inset active fill.
// Kept compact (small) so it aligns beside the scope Autocomplete on one row.
export const ScopeToggleGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5),
  gap: theme.spacing(0.5),
  flexShrink: 0,

  '& .MuiToggleButtonGroup-grouped': {
    border: 0,
    borderRadius: `calc(${theme.shape.borderRadius}px - ${theme.spacing(0.5)}) !important`,
    textTransform: 'none',
    color: theme.palette.text.secondary,
    paddingBlock: theme.spacing(0.75),
    paddingInline: theme.spacing(2),

    '&:hover': {
      backgroundColor: theme.palette.divider,
    },

    '&.Mui-selected': {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.surface.glow,
      boxShadow: `inset 0 0 0 1px ${theme.palette.border.glow}`,

      '&:hover': {
        backgroundColor: theme.palette.surface.glow,
      },
    },
  },
}));
