import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { useCurrentUser } from '@/hooks/user.hooks';
import { ProfileRow } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenuProfile: React.FC = () => {
  const { data: user } = useCurrentUser();

  const initials = user?.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') ?? '';

  return (
    <ProfileRow>
      <Avatar
        src={user?.avatarUrl}
        alt={user?.name}
        sx={(theme) => ({
          width: 48,
          height: 48,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          fontSize: theme.typography.body1.fontSize,
          fontWeight: theme.typography.fontWeightBold,
        })}
      >
        {!user?.avatarUrl && initials}
      </Avatar>

      <Box>
        <Typography variant="body1" color="textPrimary" noWrap>
          {user?.name}
        </Typography>
        <Typography variant="body2" color="textDisabled" noWrap>
          {user?.role}
        </Typography>
      </Box>
    </ProfileRow>
  );
};

export default SideMenuProfile;
