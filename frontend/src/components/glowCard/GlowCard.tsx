import React from 'react';
import Typography from '@mui/material/Typography';
import { SparkleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { CardRoot, TextContent } from '@/components/glowCard/components/glowCard.styled';

const GlowCard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <CardRoot>
      <SparkleIcon size={32} weight="fill" color={theme.palette.primary.main} />

      <TextContent>
        <Typography variant="subtitle1" color="text.primary">
          {t('dashboard.focusCueLabel')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboard.focusCueText')}
        </Typography>
      </TextContent>

    </CardRoot>
  );
};

export default GlowCard;
