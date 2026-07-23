import { COPY_FEEDBACK_DURATION_MS } from "@/constants";
import { KeyValueRow } from "@/components/keyValueRow/components/keyValueRow.styled";
import type { CopyFieldProps } from "@/components/copyField/types/copyField.types";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import React, { useState } from "react";

const CopyField: React.FC<CopyFieldProps> = ({
  label,
  value,
  copyLabel,
  copiedLabel,
  children,
}) => {
  const theme = useTheme();
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), COPY_FEEDBACK_DURATION_MS);
    });
  };

  // The label flips with state so screen readers announce the result on the next read
  const actionLabel = hasCopied ? copiedLabel : copyLabel;

  return (
    <Box>
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ display: "block", marginBottom: 1 }}
      >
        {label}
      </Typography>

      <KeyValueRow>
        {children}

        <Tooltip title={actionLabel}>
          <IconButton size="small" onClick={handleCopy} aria-label={actionLabel}>
            {hasCopied ? (
              <CheckIcon size={theme.iconSize.sm} color={theme.palette.success.main} />
            ) : (
              <CopyIcon size={theme.iconSize.sm} />
            )}
          </IconButton>
        </Tooltip>
      </KeyValueRow>
    </Box>
  );
};

export default CopyField;
