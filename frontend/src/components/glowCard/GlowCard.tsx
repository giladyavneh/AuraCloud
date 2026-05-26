import Aurora from "@/components/aurora/Aurora";
import {
  AuroraLayer,
  ContentRow,
  FocusCueLabel,
  Scrim,
} from "@/components/glowCard/components/glowCard.styled";
import { toHexColor } from "@/components/glowCard/helpers/glowCard.helpers";
import SpotlightCard from "@/components/spotlightCard/SpotlightCard";
import { alpha, darken, lighten, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTranslation } from "react-i18next";

interface GlowCardProps {
  focusText?: string;
}

const GlowCard: React.FC<GlowCardProps> = ({ focusText }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Three-stop gradient driven purely from theme.primary — a deeper purple,
  // the base lavender, and a soft highlight. MUI's darken/lighten return rgb()
  // strings; Aurora's WebGL parser only accepts hex, hence the normaliser.
  const auroraStops = [
    toHexColor(darken(theme.palette.primary.main, 0.35)),
    theme.palette.primary.main,
    toHexColor(lighten(theme.palette.primary.main, 0.2)),
  ];

  return (
    <SpotlightCard spotlightColor={alpha(theme.palette.primary.main, 0.18)}>
      <AuroraLayer>
        <Aurora colorStops={auroraStops} amplitude={1.0} blend={0.5} speed={0.6} />
      </AuroraLayer>

      <Scrim />

      <ContentRow>
        <FocusCueLabel>{t("dashboard.focusCueBadge")}</FocusCueLabel>

        <Typography variant="body2" color="textSecondary">
          {focusText ?? t("dashboard.focusCueNoData")}
        </Typography>
      </ContentRow>
    </SpotlightCard>
  );
};

export default GlowCard;
