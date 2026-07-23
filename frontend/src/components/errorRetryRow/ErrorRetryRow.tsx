import type { ErrorRetryRowProps } from "@/components/errorRetryRow/types/errorRetryRow.types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { WarningCircleIcon } from "@phosphor-icons/react";
import React from "react";

const ErrorRetryRow: React.FC<ErrorRetryRowProps> = ({ message, retryLabel, onRetry }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
      <Box sx={{ display: "flex", flexShrink: 0 }}>
        <WarningCircleIcon size={theme.iconSize.sm} color={theme.palette.error.main} />
      </Box>

      <Typography variant="body2" color="error">
        {message}
      </Typography>

      <Button variant="text" onClick={onRetry}>
        {retryLabel}
      </Button>
    </Box>
  );
};

export default ErrorRetryRow;
