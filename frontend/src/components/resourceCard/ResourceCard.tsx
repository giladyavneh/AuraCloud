import React from 'react';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import StatusTag from '@/components/statusTag/StatusTag';
import AwsServiceIcon from '@/components/awsServiceIcon/AwsServiceIcon';
import { getResourceDotColor, MAX_VISIBLE_RESOURCES } from '@/components/resourceCard/helpers/resourceCard.helpers';
import {
  CardRoot,
  CardBody,
  CardHeader,
  ServiceInfo,
  ServiceMeta,
  ResourceList,
  ResourceItem,
  ResourceDot,
  ErrorBanner,
} from '@/components/resourceCard/components/resourceCard.styled';
import type { ResourceCardProps } from '@/components/resourceCard/types/resourceCard.types';

const ResourceCard: React.FC<ResourceCardProps> = ({
  service,
  title,
  lastUpdated,
  status,
  resources,
  errorMessage,
  maxVisibleResources = MAX_VISIBLE_RESOURCES,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const visibleResources = resources.slice(0, maxVisibleResources);
  const remainingCount = resources.length - maxVisibleResources;
  const dotColor = getResourceDotColor(theme.palette, status);

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
              <ResourceDot dotColor={dotColor} />
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
