import { useUpsertWatchlistPreset } from "@/hooks/team.hooks";
import { fromPresetResources, toPresetResourcePayload } from "@/pages/team/helpers/team.helpers";
import {
  EditorActionsRow,
  EditorHeaderRow,
  EditorSection,
  PresetEditorRoot,
  ScopeToggleGroup,
  StalenessNotice,
} from "@/pages/team/components/team.styled";
import type { PresetEditorProps } from "@/pages/team/types/team.types";
import AddResourceForm from "@/pages/resourceWatchlist/components/AddResourceForm";
import JsonEditorPanel from "@/pages/resourceWatchlist/components/JsonEditorPanel";
import WatchlistTable from "@/pages/resourceWatchlist/components/WatchlistTable";
import {
  LeftPanel,
  PanelCard,
  PanelEmptyState,
} from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type { Employee, PresetScopeType, Team } from "@/pages/team/types/team.types";
import type { WatchlistResource } from "@/services/resources.service";
import { CurrentKeyRow } from "@/pages/settings/components/settings.styled";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  ArrowLeftIcon,
  InfoIcon,
  ListBulletsIcon,
  UserIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const sortedSnapshot = (resources: { arn: string; actions: string[] }[]) =>
  JSON.stringify(
    [...resources]
      .map(({ arn, actions }) => ({ arn, actions }))
      .sort((a, b) => a.arn.localeCompare(b.arn)),
  );

const PresetEditor: React.FC<PresetEditorProps> = ({
  preset,
  teams,
  employees,
  presets,
  onCancel,
  onSaved,
  onError,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isCreateMode = preset === null;

  const [scopeType, setScopeType] = useState<PresetScopeType>(preset?.scopeType ?? "team");
  const [scopeId, setScopeId] = useState<string | null>(preset?.scopeId ?? null);
  const [name, setName] = useState(preset?.name ?? "");
  const [draftResources, setDraftResources] = useState<WatchlistResource[]>(
    fromPresetResources(preset?.resources ?? []),
  );

  const { mutateAsync: upsertPreset, isPending: isSaving } = useUpsertWatchlistPreset();

  // Only offer targets that don't already have a preset — "one preset per scope" is
  // a v1 constraint the picker should respect, not a confirm-then-fail path.
  const eligibleTeams = useMemo<Team[]>(
    () => teams.filter((team) => !presets.some((p) => p.scopeType === "team" && p.scopeId === team._id)),
    [teams, presets],
  );
  const eligibleEmployees = useMemo<Employee[]>(
    () =>
      employees.filter(
        (employee) => !presets.some((p) => p.scopeType === "individual" && p.scopeId === employee._id),
      ),
    [employees, presets],
  );

  const scopeLabel = useMemo(() => {
    if (!scopeId) return "";
    if (scopeType === "team") return teams.find((team) => team._id === scopeId)?.name ?? "";
    const employee = employees.find((e) => e._id === scopeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "";
  }, [scopeType, scopeId, teams, employees]);

  const isDirty = useMemo(
    () => sortedSnapshot(draftResources) !== sortedSnapshot(preset?.resources ?? []),
    [draftResources, preset],
  );

  const handleAddResource = (resource: WatchlistResource) => {
    const existing = draftResources.find((r) => r.arn === resource.arn);
    if (existing) {
      const mergedActions = [...new Set([...existing.actions, ...resource.actions])];
      setDraftResources(
        draftResources.map((r) => (r.arn === resource.arn ? { ...r, actions: mergedActions } : r)),
      );
    } else {
      setDraftResources([...draftResources, resource]);
    }
  };

  const handleRemoveResource = (arn: string) => {
    setDraftResources(draftResources.filter((r) => r.arn !== arn));
  };

  const handleScopeTypeChange = (_: React.MouseEvent<HTMLElement>, value: PresetScopeType | null) => {
    if (!value) return;
    setScopeType(value);
    setScopeId(null);
  };

  const handleSave = async () => {
    if (!scopeId) return;
    const finalName = name.trim() || t("team.presets.nameFieldDefault", { scopeLabel });
    try {
      await upsertPreset({
        scopeType,
        scopeId,
        name: finalName,
        resources: toPresetResourcePayload(draftResources),
      });
      onSaved(
        isCreateMode ? t("team.presets.createSuccess", { scopeLabel }) : t("team.presets.editSuccess"),
      );
    } catch {
      onError(isCreateMode ? t("team.presets.createError") : t("team.presets.editError"));
    }
  };

  return (
    <PresetEditorRoot>
      <EditorHeaderRow>
        <IconButton onClick={onCancel} aria-label={t("team.presets.backToPresets")}>
          <ArrowLeftIcon size={theme.iconSize.sm} />
        </IconButton>

        <Typography variant="h6" color="textPrimary">
          {isCreateMode
            ? t("team.presets.newPresetTitle")
            : t("team.presets.editPresetTitle", { scopeLabel })}
        </Typography>
      </EditorHeaderRow>

      <EditorSection>
        <Typography variant="subtitle1" color="textPrimary">
          {t("team.presets.scopeLabel")}
        </Typography>

        {isCreateMode ? (
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
                  onChange={(_, value) => setScopeId(value?._id ?? null)}
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
                  onChange={(_, value) => setScopeId(value?._id ?? null)}
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
                onChange={(event) => setName(event.target.value)}
              />
            </Box>

            {scopeType === "team" && eligibleTeams.length === 0 && (
              <Typography variant="caption" color="textSecondary">
                {t("team.presets.noEligibleTeams")}
              </Typography>
            )}
            {scopeType === "individual" && eligibleEmployees.length === 0 && (
              <Typography variant="caption" color="textSecondary">
                {t("team.presets.noEligibleIndividuals")}
              </Typography>
            )}
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
            <CurrentKeyRow sx={{ flexGrow: 1 }}>
              <Box sx={{ display: "flex", flexShrink: 0 }}>
                {preset.scopeType === "team" ? (
                  <UsersIcon size={theme.iconSize.xs} />
                ) : (
                  <UserIcon size={theme.iconSize.xs} />
                )}
              </Box>

              <Typography variant="body2" color="textPrimary">
                {scopeLabel}
              </Typography>
            </CurrentKeyRow>

            <TextField
              sx={{ flexGrow: 1 }}
              label={t("team.presets.nameFieldLabel")}
              size="small"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Box>
        )}
      </EditorSection>

      <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, lg: 7 }} sx={{ height: "100%" }}>
          <LeftPanel>
            <PanelCard>
              <Typography variant="subtitle1" color="textPrimary">
                {t("resourceWatchlist.addResource")}
              </Typography>

              <AddResourceForm onAdd={handleAddResource} />
            </PanelCard>

            <PanelCard sx={{ flex: 1, overflow: "auto" }}>
              {draftResources.length === 0 ? (
                <PanelEmptyState>
                  <ListBulletsIcon size={36} color={theme.palette.text.disabled} />

                  <Box>
                    <Typography variant="subtitle1" color="textPrimary">
                      {t("resourceWatchlist.emptyState.title")}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ marginTop: 0.5 }}>
                      {t("resourceWatchlist.emptyState.description")}
                    </Typography>
                  </Box>
                </PanelEmptyState>
              ) : (
                <WatchlistTable resources={draftResources} onRemove={handleRemoveResource} />
              )}
            </PanelCard>
          </LeftPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }} sx={{ height: "100%" }}>
          <JsonEditorPanel draftResources={draftResources} onDraftChange={setDraftResources} />
        </Grid>
      </Grid>

      {(scopeId || !isCreateMode) && (
        <StalenessNotice>
          <InfoIcon size={theme.iconSize.xs} color={theme.palette.text.secondary} />
          <Typography variant="caption" color="textSecondary">
            {t("team.presets.stalenessNotice", { scope: scopeLabel })}
          </Typography>
        </StalenessNotice>
      )}

      <EditorActionsRow>
        {isDirty && (
          <Typography variant="caption" color="warning.main">
            {t("resourceWatchlist.unsavedChanges")}
          </Typography>
        )}

        <Button variant="text" color="inherit" onClick={onCancel} disabled={isSaving}>
          {t("team.presets.cancel")}
        </Button>

        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={isSaving || !scopeId}
          startIcon={
            isSaving ? <CircularProgress size={theme.iconSize.xs} color="inherit" /> : undefined
          }
        >
          {isSaving
            ? t("team.presets.saving")
            : isCreateMode
              ? t("team.presets.createPreset")
              : t("team.presets.saveChanges")}
        </Button>
      </EditorActionsRow>
    </PresetEditorRoot>
  );
};

export default PresetEditor;
