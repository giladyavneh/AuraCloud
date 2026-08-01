import { KeyValueRow } from "@/components/keyValueRow/components/keyValueRow.styled";
import type { PresetScopeSummaryProps } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { UserIcon, UsersIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

/** Scope display shown while editing a preset — the scope itself is fixed, only the name can change. */
const PresetScopeSummary: React.FC<PresetScopeSummaryProps> = ({
  scopeType,
  scopeLabel,
  name,
  onNameChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
      <KeyValueRow sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", flexShrink: 0 }}>
          {scopeType === "team" ? (
            <UsersIcon size={theme.iconSize.xs} />
          ) : (
            <UserIcon size={theme.iconSize.xs} />
          )}
        </Box>

        <Typography variant="body2" color="textPrimary">
          {scopeLabel}
        </Typography>
      </KeyValueRow>

      <TextField
        sx={{ flexGrow: 1 }}
        label={t("team.presets.nameFieldLabel")}
        size="small"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />
    </Box>
  );
};

export default PresetScopeSummary;
