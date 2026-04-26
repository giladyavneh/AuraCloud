import React from 'react';
import { IconWrapper, ServiceLabel } from '@/components/awsServiceIcon/awsServiceIcon.styled';
import { SERVICE_CONFIG } from '@/components/awsServiceIcon/helpers/awsServiceIcon.helpers';
import type { AwsServiceIconProps } from '@/components/awsServiceIcon/types/awsServiceIcon.types';

const AwsServiceIcon: React.FC<AwsServiceIconProps> = ({ service, size = 46 }) => {
  const config = SERVICE_CONFIG[service];
  const fontSize = Math.round(size * 0.28);

  return (
    <IconWrapper bgColor={config.bg} iconSize={size}>
      <ServiceLabel fontSize={fontSize}>{config.label}</ServiceLabel>
    </IconWrapper>
  );
};

export default AwsServiceIcon;
