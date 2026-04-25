import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { StatCardProps } from '@/components/statCard/types/statCard.types';

const CardRoot = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '16px 24px',
  backgroundColor: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  minWidth: 0,
});

const StatValue = styled('p', {
  shouldForwardProp: (prop) => prop !== 'valueColor',
})<{ valueColor?: string }>(({ valueColor }) => ({
  margin: 0,
  fontSize: '34px',
  fontWeight: 400,
  lineHeight: '40px',
  letterSpacing: '0.25px',
  color: valueColor ?? '#f8fafc',
  fontFamily: '"Rubik", sans-serif',
}));

const StatCard = ({ title, value, valueColor }: StatCardProps) => (
  <CardRoot>
    <Typography variant="caption" color="text.disabled">
      {title}
    </Typography>
    <StatValue valueColor={valueColor}>{value}</StatValue>
  </CardRoot>
);

export default StatCard;
