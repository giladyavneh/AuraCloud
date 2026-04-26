import React from 'react';
import Typography from '@mui/material/Typography';
import { Sparkle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { CardRoot, TextContent } from '@/components/glowCard/glowCard.styled';

const GlowCard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <CardRoot>
      <Sparkle size={32} weight="fill" color={theme.palette.primary.main} />

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
