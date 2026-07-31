import React from "react";
import Typography from "@mui/material/Typography";
import {
  CardRoot,
  CardInner,
  StatValue,
} from "@/components/statCard/components/statCard.styled";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import type { StatCardProps } from "@/components/statCard/types/statCard.types";

const StatCard: React.FC<StatCardProps> = ({ title, value, valueColor }) => {
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>();

  return (
    <CardRoot>
      <CardInner ref={ref} onMouseMove={onMouseMove}>
        <Typography variant="caption" color="textDisabled">
          {title}
        </Typography>

        <StatValue valueColor={valueColor}>{value}</StatValue>
      </CardInner>
    </CardRoot>
  );
};

export default StatCard;
