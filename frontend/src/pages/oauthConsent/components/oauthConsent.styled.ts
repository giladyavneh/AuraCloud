import {
  CONSENT_CARD_MAX_WIDTH,
  DESTINATION_PANEL_MIN_HEIGHT,
  LOGO_BADGE_SIZE,
} from '@/pages/oauthConsent/constants';
import type { RenderedRedirectClass } from '@/pages/oauthConsent/types/oauthConsent.types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';

/** Maps a destination class onto the same palette triple StatusTag uses for its variant. */
const classPalette = {
  local: 'success',
  remote: 'warning',
} as const satisfies Record<RenderedRedirectClass, 'success' | 'warning'>;

export const ConsentRoot = styled('main')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.surface.canvas,
  padding: theme.spacing(4),

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

export const ConsentCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: CONSENT_CARD_MAX_WIDTH,
  padding: theme.spacing(5),
  backgroundColor: theme.palette.surface.base,
  border: `1px solid ${theme.palette.border.default}`,
  borderRadius: (theme.shape.borderRadius as number) * 2,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),

  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
  },
}));

export const HeaderBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(2),
}));

export const LogoBadge = styled(Box)(({ theme }) => ({
  width: LOGO_BADGE_SIZE,
  height: LOGO_BADGE_SIZE,
  borderRadius: (theme.shape.borderRadius as number) + 4,
  backgroundColor: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.background.default,
  marginBottom: theme.spacing(1),
}));

export const LoadingBlock = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: DESTINATION_PANEL_MIN_HEIGHT,
});

export const DestinationPanel = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'redirectClass',
})<{ redirectClass: RenderedRedirectClass }>(({ theme, redirectClass }) => {
  const tone = theme.palette[classPalette[redirectClass]];

  return {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: tone.dark,
    border: `1px solid ${tone.contrastText}`,
  };
});

export const OriginLine = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

export const SchemeText = styled('span')(({ theme }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.text.disabled,
}));

export const HostLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isEmphasised',
})<{ isEmphasised: boolean }>(({ theme, isEmphasised }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.h5.fontSize,
  fontWeight: 500,
  color: isEmphasised ? theme.palette.text.primary : theme.palette.text.disabled,
  wordBreak: 'break-all',
}));

export const PathText = styled('span')(({ theme }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.disabled,
  wordBreak: 'break-all',
}));

export const MonoValue = styled('span')(({ theme }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  wordBreak: 'break-all',
  flexGrow: 1,
}));

export const SectionBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

/** One leading icon beside one line of text — the access rows and the unverified notice. */
export const IconRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
}));

export const ActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),

  // Approve must not be the thumb-nearest control on a phone.
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column-reverse',
  },
}));

/**
 * A genuinely `disabled` button leaves the tab order, so a screen reader user gets no
 * explanation for why the flow is stuck. This one stays focusable and only looks
 * disabled; the click handler no-ops while the acknowledgement is missing.
 */
export const SoftDisabledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isSoftDisabled',
})<{ isSoftDisabled: boolean }>(({ theme, isSoftDisabled }) =>
  isSoftDisabled
    ? {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
        '&:hover': { backgroundColor: theme.palette.action.disabledBackground },
      }
    : {},
);

export const InvalidBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(3),
}));

export const VisuallyHidden = styled('span')({
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
