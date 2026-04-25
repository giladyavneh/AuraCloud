import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import type { AwsServiceIconProps, AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';

/**
 * AWS Architecture Icon style: colored rounded square + white service SVG.
 * Colors follow the official AWS service category color coding.
 */

const SERVICE_CONFIG: Record<AwsService, { bg: string; label: string }> = {
  s3:         { bg: '#3d8b37', label: 'S3'  },
  sqs:        { bg: '#e7720b', label: 'SQS' },
  ecr:        { bg: '#e7720b', label: 'ECR' },
  lambda:     { bg: '#e7720b', label: 'λ'   },
  ec2:        { bg: '#e7720b', label: 'EC2' },
  rds:        { bg: '#3232d0', label: 'RDS' },
  cloudwatch: { bg: '#e7157b', label: 'CW'  },
};

const IconWrapper = styled(Box)<{ bgColor: string; size: number }>(({ bgColor, size }) => ({
  width: size,
  height: size,
  borderRadius: '8px',
  backgroundColor: bgColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}));

const ServiceLabel = styled('span')<{ fontSize: number }>( ({ fontSize }) => ({
  color: '#ffffff',
  fontFamily: '"Rubik", sans-serif',
  fontWeight: 500,
  fontSize,
  lineHeight: 1,
  userSelect: 'none',
}));

const AwsServiceIcon = ({ service, size = 46 }: AwsServiceIconProps) => {
  const config = SERVICE_CONFIG[service];
  const fontSize = size * 0.28;

  return (
    <IconWrapper bgColor={config.bg} size={size}>
      <ServiceLabel fontSize={fontSize}>{config.label}</ServiceLabel>
    </IconWrapper>
  );
};

export default AwsServiceIcon;
