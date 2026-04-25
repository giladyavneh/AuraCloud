import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import type { StatusTagProps, StatusTagVariant } from '@/components/statusTag/types/statusTag.types';

const STATUS_STYLES: Record<
  StatusTagVariant,
  { bg: string; border: string; dotColor: string; textColor: string }
> = {
  healthy: {
    bg: '#052e2b',
    border: '#065f46',
    dotColor: '#34d399',
    textColor: '#34d399',
  },
  blocked: {
    bg: '#3c0707',
    border: '#b91c1c',
    dotColor: '#f87171',
    textColor: '#f87171',
  },
  stale: {
    bg: '#1f2937',
    border: '#334155',
    dotColor: '#94a3b8',
    textColor: '#94a3b8',
  },
  online: {
    bg: '#052e2b',
    border: '#065f46',
    dotColor: '#34d399',
    textColor: '#34d399',
  },
};

// Use shouldForwardProp so 'tagVariant' never hits the DOM
const TagContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tagVariant',
})<{ tagVariant: StatusTagVariant }>(({ tagVariant }) => {
  const styles = STATUS_STYLES[tagVariant];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '8px',
    border: `1px solid ${styles.border}`,
    backgroundColor: styles.bg,
  };
});

const Dot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'tagVariant',
})<{ tagVariant: StatusTagVariant }>(({ tagVariant }) => ({
  width: 7,
  height: 7,
  borderRadius: '50%',
  backgroundColor: STATUS_STYLES[tagVariant].dotColor,
  flexShrink: 0,
}));

const TagLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'tagVariant',
})<{ tagVariant: StatusTagVariant }>(({ tagVariant }) => ({
  fontSize: '12px',
  fontWeight: 400,
  lineHeight: 1,
  color: STATUS_STYLES[tagVariant].textColor,
  whiteSpace: 'nowrap',
  fontFamily: '"Rubik", sans-serif',
}));

const DEFAULT_LABELS: Record<StatusTagVariant, string> = {
  healthy: 'status.healthy',
  blocked: 'status.blocked',
  stale: 'status.stale',
  online: 'status.online',
};

const StatusTag = ({ variant, label }: StatusTagProps) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t(DEFAULT_LABELS[variant]);

  return (
    <TagContainer tagVariant={variant}>
      <Dot tagVariant={variant} />
      <TagLabel tagVariant={variant}>{resolvedLabel}</TagLabel>
    </TagContainer>
  );
};

export default StatusTag;
