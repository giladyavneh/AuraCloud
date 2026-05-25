import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { useCurrentUser } from '@/hooks/user.hooks';
import { ProfileRow } from '@/components/sideMenu/components/sideMenu.styled';

const SideMenuProfile: React.FC = () => {
  const { data: user } = useCurrentUser();

  return (
    <ProfileRow>
      <Avatar
        src={user?.avatarUrl ?? ''}
        alt={user?.name}
        sx={(theme) => ({ width: 48, height: 48, bgcolor: theme.palette.divider })}
      />

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
