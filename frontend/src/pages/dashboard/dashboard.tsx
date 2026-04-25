import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import StatusTag from '@/components/statusTag/statusTag';
import StatCard from '@/components/statCard/statCard';
import GlowCard from '@/components/glowCard/glowCard';
import ResourceCard from '@/components/resourceCard/resourceCard';
import { useUserResourceWatchlist } from '@/hooks/resources.hooks';
import type { AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives an AwsService key from a resource ARN.
 * Falls back to 's3' when the service cannot be determined.
 */
const inferServiceFromArn = (arn: string): AwsService => {
  if (arn.includes(':s3'))       return 's3';
  if (arn.includes(':sqs'))      return 'sqs';
  if (arn.includes(':ecr'))      return 'ecr';
  if (arn.includes(':lambda'))   return 'lambda';
  if (arn.includes(':ec2'))      return 'ec2';
  if (arn.includes(':rds'))      return 'rds';
  return 's3';
};

/**
 * Derives a human-readable service title from an ARN service segment.
 */
const inferTitleFromArn = (arn: string): string => {
  const serviceMap: Record<string, string> = {
    s3: 'S3',
    sqs: 'SQS',
    ecr: 'ECR • versions',
    lambda: 'Lambda',
    ec2: 'EC2',
    rds: 'RDS',
  };
  const match = /arn:aws:([^:]+):/.exec(arn);
  const key = match?.[1] ?? 's3';
  return serviceMap[key] ?? key.toUpperCase();
};

// ---------------------------------------------------------------------------
// Styled components (page-scoped, not reused elsewhere)
// ---------------------------------------------------------------------------

const PageRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
});

const StatusSummaryRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  backgroundColor: '#111827',   // color/surface/base
  border: '1px solid #1f2937',
  borderRadius: '8px',
});

const StatusSummaryLeft = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const StatusSummaryRight = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const StatsRow = styled(Box)({
  display: 'flex',
  gap: '16px',
});

const ResourceSectionHeader = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: watchlist, isLoading, isError } = useUserResourceWatchlist();

  return (
    <PageRoot>
      {/* Status Summary */}
      <StatusSummaryRow>
        <StatusSummaryLeft>
          <Typography variant="caption" color="text.disabled">
            {t('dashboard.globalStatus')}
          </Typography>
          <Typography variant="h4" color="text.primary">
            {t('dashboard.healthHeading', 'Healthy with 1 active blocker')}
          </Typography>
        </StatusSummaryLeft>
        <StatusSummaryRight>
          <StatusTag variant="online" />
          <Button
            variant="outlined"
            sx={{
              borderColor: '#dfb5fd',
              color: '#dfb5fd',
              '&:hover': { borderColor: '#dfb5fd', backgroundColor: '#dfb5fd22' },
              borderRadius: '8px',
              textTransform: 'none',
              fontFamily: '"Rubik", sans-serif',
            }}
          >
            {t('dashboard.refresh')}
          </Button>
        </StatusSummaryRight>
      </StatusSummaryRow>

      {/* Statistics Summary */}
      <StatsRow>
        <StatCard
          title={t('dashboard.stats.totalResources')}
          value={watchlist?.reduce((acc, item) => acc + item.resources.length, 0) ?? 42}
          valueColor="#f8fafc"
        />
        <StatCard
          title={t('dashboard.stats.activeBlockers')}
          value={1}
          valueColor="#f87171"
        />
        <StatCard
          title={t('dashboard.stats.staleResources')}
          value={1}
          valueColor="#fbbf24"
        />
        <StatCard
          title={t('dashboard.stats.healthScore')}
          value="93%"
          valueColor="#34d399"
        />
      </StatsRow>

      {/* Resource Status section header */}
      <ResourceSectionHeader>
        <Typography variant="h5" color="text.primary">
          {t('dashboard.resourceStatus')}
        </Typography>
        <Typography variant="body2" color="text.disabled">
          {t('dashboard.resourceStatusDescription')}
        </Typography>
      </ResourceSectionHeader>

      {/* Glow / focus cue card */}
      <GlowCard />

      {/* Resource Cards grid */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#dfb5fd' }} />
        </Box>
      )}

      {isError && (
        <Typography variant="body2" color="error.main">
          {t('resourceCard.errorPrefix')} Could not load resource watchlist.
        </Typography>
      )}

      {watchlist && (
        <Grid container spacing={2}>
          {watchlist.map((item) => {
            const firstArn = item.resources[0]?.arn ?? '';
            const service = inferServiceFromArn(firstArn);
            const title = inferTitleFromArn(firstArn);
            const resourceNames = item.resources.map(
              (r) => r.arn.split(':::')[1] ?? r.arn,
            );

            // Derive a display status from the item index (mock logic until real statuses land)
            const statusOptions: StatusTagVariant[] = ['blocked', 'stale', 'healthy'];
            const status = statusOptions[watchlist.indexOf(item) % statusOptions.length] ?? 'healthy';

            return (
              <Grid key={item._id} size={{ xs: 12, md: 6 }}>
                <ResourceCard
                  service={service}
                  title={title}
                  lastUpdated={`${watchlist.indexOf(item) + 1} min ago`}
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
    </PageRoot>
  );
};

export default Dashboard;
