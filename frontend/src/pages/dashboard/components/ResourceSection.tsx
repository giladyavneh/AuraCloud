import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import GlowCard from '@/components/glowCard/GlowCard';
import ResourceCard from '@/components/resourceCard/ResourceCard';
import { useUserResourceWatchlist } from '@/hooks/resources.hooks';
import { inferServiceFromArn, inferTitleFromArn } from '@/pages/dashboard/helpers/dashboard.helpers';
import { ResourceSectionHeader } from '@/pages/dashboard/components/dashboard.styled';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';

const STATUS_CYCLE: StatusTagVariant[] = ['blocked', 'stale', 'healthy'];

const ResourceSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: watchlist, isLoading, isError } = useUserResourceWatchlist();

  return (
    <>
      <ResourceSectionHeader>
        <Typography variant="h5" color="text.primary">
          {t('dashboard.resourceStatus')}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t('dashboard.resourceStatusDescription')}
        </Typography>
      </ResourceSectionHeader>

      <GlowCard />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {isError && (
        <Typography variant="body2" color="error.main">
          {t('resourceCard.errorPrefix')} Could not load resource watchlist.
        </Typography>
      )}

      {watchlist && (
        <Grid container spacing={2}>
          {watchlist.map((item, index) => {
            const firstArn = item.resources[0]?.arn ?? '';
            const service = inferServiceFromArn(firstArn);
            const title = inferTitleFromArn(firstArn);
            const resourceNames = item.resources.map((r) => r.arn.split(':::')[1] ?? r.arn);
            const status = STATUS_CYCLE[index % STATUS_CYCLE.length] ?? 'healthy';

            return (
              <Grid key={item._id} size={{ xs: 12, md: 6 }}>
                <ResourceCard
                  service={service}
                  title={title}
                  lastUpdated={`${index + 1} min ago`}
                  status={status}
                  resources={resourceNames}
                  errorMessage={
                    status === 'blocked'
                      ? "Missing permission 's3:PutObject'."
                      : undefined
                  }
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
};

export default ResourceSection;
