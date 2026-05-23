import React from "react";
import Typography from "@mui/material/Typography";
import {
  CardRoot,
  CardInner,
  StatValue,
} from "@/components/statCard/components/statCard.styled";
import type { StatCardProps } from "@/components/statCard/types/statCard.types";

const StatCard: React.FC<StatCardProps> = ({ title, value, valueColor }) => (
  <CardRoot>
    <CardInner>
      <Typography variant="caption" color="textDisabled">
        {title}
      </Typography>

      <StatValue valueColor={valueColor}>{value}</StatValue>
    </CardInner>
  </CardRoot>
);

export default StatCard;
