import { IconRow } from '@/pages/oauthConsent/components/oauthConsent.styled';
import type { ConsentAccessItemProps } from '@/pages/oauthConsent/types/oauthConsent.types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

const ConsentAccessItem: React.FC<ConsentAccessItemProps> = ({ icon, label }) => (
  <IconRow>
    <Box sx={{ display: 'flex', flexShrink: 0 }}>{icon}</Box>

    <Typography variant="body2" color="textSecondary">
      {label}
    </Typography>

  </IconRow>
);

export default ConsentAccessItem;
