import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import StatusTag from '@/components/statusTag/statusTag';
import AwsServiceIcon from '@/components/awsServiceIcon/awsServiceIcon';
import type { ResourceCardProps } from '@/components/resourceCard/types/resourceCard.types';

const MAX_VISIBLE = 3;

const RESOURCE_DOT_COLORS: Record<string, string> = {
  healthy: '#34d399',
  blocked: '#f87171',
  stale: '#fbbf24',
};

const CardRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#111827',   // color/surface/base
  border: '1px solid #1f2937', // color/border/default
  borderRadius: '8px',
  overflow: 'hidden',
});

const CardBody = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '16px',
});

const CardHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const ServiceInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const ServiceMeta = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

const ResourceList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

const ResourceItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const ResourceDot = styled(Box)<{ status: string }>(({ status }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: RESOURCE_DOT_COLORS[status] ?? '#94a3b8',
  flexShrink: 0,
}));

const ErrorBanner = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  backgroundColor: '#3c0707',  // color/surface/error
  border: '1px solid #b91c1c', // color/border/error
  borderTop: 'none',
});

const ResourceCard = ({
  service,
  title,
  lastUpdated,
  status,
  resources,
  errorMessage,
  maxVisibleResources = MAX_VISIBLE,
}: ResourceCardProps) => {
  const { t } = useTranslation();
  const visibleResources = resources.slice(0, maxVisibleResources);
  const remainingCount = resources.length - maxVisibleResources;

  return (
    <CardRoot>
      <CardBody>
        <CardHeader>
          <ServiceInfo>
            <AwsServiceIcon service={service} size={46} />
            <ServiceMeta>
              <Typography variant="caption" color="text.disabled">
                {lastUpdated}
              </Typography>
              <Typography variant="h5" color="text.primary">
                {title}
              </Typography>
            </ServiceMeta>
          </ServiceInfo>
          <StatusTag variant={status} />
        </CardHeader>

        <ResourceList>
          <Typography variant="subtitle1" color="text.secondary">
            {t('resourceCard.resources')}
          </Typography>
          {visibleResources.map((resource) => (
            <ResourceItem key={resource}>
              <ResourceDot status={status} />
              <Typography variant="body2" color="text.secondary">
                {resource}
              </Typography>
            </ResourceItem>
          ))}
          {remainingCount > 0 && (
            <Typography
              variant="body2"
              color="primary.main"
              sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
            >
              {t('resourceCard.moreResources', { count: remainingCount })}
            </Typography>
          )}
        </ResourceList>
      </CardBody>

      {errorMessage && (
        <ErrorBanner>
          <Typography variant="body2" color="error.main">
            {t('resourceCard.errorPrefix')} {errorMessage}
          </Typography>
          <Typography
            variant="body2"
            color="error.main"
            sx={{ cursor: 'pointer', fontWeight: 500, '&:hover': { opacity: 0.8 } }}
          >
            {t('resourceCard.details')}
          </Typography>
        </ErrorBanner>
      )}
    </CardRoot>
  );
};

export default ResourceCard;
