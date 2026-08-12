import { EmptyStateRoot } from "@/components/emptyState/components/emptyState.styled";
import type { EmptyStateProps } from "@/components/emptyState/types/emptyState.types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React from "react";

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaRef,
}) => (
  <EmptyStateRoot>
    {icon}

    <Box>
      <Typography variant="h6" color="textPrimary">
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
        {description}
      </Typography>
    </Box>

    <Button ref={ctaRef} variant="contained" size="large" onClick={onCta}>
      {ctaLabel}
    </Button>
  </EmptyStateRoot>
);

export default EmptyState;
