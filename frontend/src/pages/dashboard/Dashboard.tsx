import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import StatCard from '@/components/statCard/StatCard';
import { useUserResourceWatchlist } from '@/hooks/resources.hooks';
import StatusSummary from '@/pages/dashboard/components/StatusSummary';
import ResourceSection from '@/pages/dashboard/components/ResourceSection';
import { PageRoot, StatsRow } from '@/pages/dashboard/components/dashboard.styled';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: watchlist } = useUserResourceWatchlist();

  const totalResources = watchlist?.reduce((acc, item) => acc + item.resources.length, 0) ?? 42;

  return (
    <PageRoot>
      <StatusSummary />

      <StatsRow>
        <StatCard
          title={t('dashboard.stats.totalResources')}
          value={totalResources}
        />
        <StatCard
          title={t('dashboard.stats.activeBlockers')}
          value={1}
          valueColor={theme.palette.error.main}
        />
        <StatCard
          title={t('dashboard.stats.staleResources')}
          value={1}
          valueColor={theme.palette.warning.main}
        />
        <StatCard
          title={t('dashboard.stats.healthScore')}
          value="93%"
          valueColor={theme.palette.success.main}
        />
      </StatsRow>

      <ResourceSection />
    </PageRoot>
  );
};

export default Dashboard;
