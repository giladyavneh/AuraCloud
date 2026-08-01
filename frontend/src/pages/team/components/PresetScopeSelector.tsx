import { ScopeToggleGroup } from "@/pages/team/components/team.styled";
import type { PresetScopeSelectorProps } from "@/pages/team/types/team.types";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";

/** Scope picker shown while creating a preset: team/individual switch, target, and name. */
const PresetScopeSelector: React.FC<PresetScopeSelectorProps> = ({
  scopeType,
  scopeId,
  name,
  eligibleTeams,
  eligibleEmployees,
  onScopeTypeChange,
  onScopeIdChange,
  onNameChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleScopeTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: typeof scopeType | null,
  ) => {
    if (!value) return;
    onScopeTypeChange(value);
  };

  const hasNoTargets =
    scopeType === "team" ? eligibleTeams.length === 0 : eligibleEmployees.length === 0;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
        <ScopeToggleGroup
          value={scopeType}
          exclusive
          onChange={handleScopeTypeChange}
          aria-label={t("team.presets.scopeLabel")}
          size="small"
        >
          <ToggleButton value="team">{t("team.presets.scopeTeam")}</ToggleButton>
          <ToggleButton value="individual">{t("team.presets.scopeIndividual")}</ToggleButton>
        </ScopeToggleGroup>

        {scopeType === "team" ? (
          <Autocomplete
            sx={{ flexGrow: 1 }}
            options={eligibleTeams}
            value={eligibleTeams.find((team) => team._id === scopeId) ?? null}
            onChange={(_event, value) => onScopeIdChange(value?._id ?? null)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField {...params} label={t("team.presets.scopeTargetLabel")} size="small" />
            )}
          />
        ) : (
          <Autocomplete
            sx={{ flexGrow: 1 }}
            options={eligibleEmployees}
            value={eligibleEmployees.find((employee) => employee._id === scopeId) ?? null}
            onChange={(_event, value) => onScopeIdChange(value?._id ?? null)}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("team.presets.scopeTargetLabelIndividual")}
                size="small"
              />
            )}
          />
        )}

        <TextField
          sx={{ flexGrow: 1 }}
          label={t("team.presets.nameFieldLabel")}
          size="small"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </Box>

      {hasNoTargets && (
        <Typography variant="caption" color="textSecondary">
          {scopeType === "team"
            ? t("team.presets.noEligibleTeams")
            : t("team.presets.noEligibleIndividuals")}
        </Typography>
      )}
    </>
  );
};

export default PresetScopeSelector;
