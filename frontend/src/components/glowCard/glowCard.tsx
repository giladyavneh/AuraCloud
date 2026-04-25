import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const CardRoot = styled(Box)({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  backgroundColor: '#dfb5fd33', // color/surface/glow
  border: '1px solid #ffffff33', // color/border/glow
  borderRadius: '8px',
  overflow: 'hidden',
  // Decorative blurred glow blobs
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -80,
    right: 0,
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(223,181,253,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -100,
    left: 120,
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,100,240,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
});

const SparkleIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M16 4L17.8 13.2L27 15L17.8 16.8L16 26L14.2 16.8L5 15L14.2 13.2L16 4Z"
      fill="#dfb5fd"
    />
    <path
      d="M26 5L26.6 8.4L30 9L26.6 9.6L26 13L25.4 9.6L22 9L25.4 8.4L26 5Z"
      fill="#dfb5fd"
      opacity="0.6"
    />
    <path
      d="M8 22L8.4 24.2L10.6 24.6L8.4 25L8 27.2L7.6 25L5.4 24.6L7.6 24.2L8 22Z"
      fill="#dfb5fd"
      opacity="0.4"
    />
  </svg>
);

const TextContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  position: 'relative',
  zIndex: 1,
});

const GlowCard = () => {
  const { t } = useTranslation();

  return (
    <CardRoot>
      <SparkleIcon />
      <TextContent>
        <Typography
          component="span"
          sx={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc', lineHeight: '20px' }}
        >
          {t('dashboard.focusCueLabel')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.focusCueText')}
        </Typography>
      </TextContent>
    </CardRoot>
  );
};

export default GlowCard;
