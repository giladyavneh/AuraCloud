import React from 'react';
import { useTranslation } from 'react-i18next';
import { TagContainer, Dot, TagLabel } from '@/components/statusTag/components/statusTag.styled';
import { DEFAULT_LABELS } from '@/components/statusTag/helpers/statusTag.helpers';
import type { StatusTagProps } from '@/components/statusTag/types/statusTag.types';

const StatusTag: React.FC<StatusTagProps> = ({ variant, label }) => {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t(DEFAULT_LABELS[variant]);

  return (
    <TagContainer tagVariant={variant}>
      <Dot tagVariant={variant} />
      <TagLabel tagVariant={variant}>{resolvedLabel}</TagLabel>
    </TagContainer>
  );
};

export default StatusTag;
