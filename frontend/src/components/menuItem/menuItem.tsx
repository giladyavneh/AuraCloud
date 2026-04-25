import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import type { MenuItemProps } from '@/components/menuItem/types/menuItem.types';

const ItemRoot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  height: 40,
  width: 220,
  borderRadius: '8px',
  cursor: 'pointer',
  overflow: 'hidden',
  ...(isActive
    ? {
        backgroundColor: '#1f2937',
        border: '1px solid #334155',
        paddingLeft: 0,
      }
    : {
        backgroundColor: '#0f172a',
        border: '1px solid transparent',
        paddingLeft: '16px',
      }),
  '&:hover': {
    backgroundColor: isActive ? '#1f2937' : '#1a2234',
  },
}));

const ActiveIndicator = styled(Box)({
  width: 4,
  height: 40,
  borderRadius: '8px 0 0 8px',
  backgroundColor: '#dfb5fd',
  flexShrink: 0,
});

const ItemLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ isActive }) => ({
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: 1,
  color: isActive ? '#f8fafc' : '#cbd5e1',
  whiteSpace: 'nowrap',
  fontFamily: '"Rubik", sans-serif',
}));

const MenuItem = ({ label, state = 'default', onClick }: MenuItemProps) => {
  const isActive = state === 'active';

  return (
    <ItemRoot isActive={isActive} onClick={onClick} role="button" tabIndex={0}>
      {isActive && <ActiveIndicator />}
      <ItemLabel isActive={isActive}>{label}</ItemLabel>
    </ItemRoot>
  );
};

export default MenuItem;
