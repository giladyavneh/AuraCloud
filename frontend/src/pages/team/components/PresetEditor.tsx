import { useUpsertWatchlistPreset } from "@/hooks/team.hooks";
import {
  fromPresetResources,
  getEligibleEmployees,
  getEligibleTeams,
  resolveScopeLabel,
  toComparablePresetResources,
  toPresetResourcePayload,
} from "@/pages/team/helpers/team.helpers";
import PresetResourcePicker from "@/pages/team/components/PresetResourcePicker";
import PresetScopeSelector from "@/pages/team/components/PresetScopeSelector";
import PresetScopeSummary from "@/pages/team/components/PresetScopeSummary";
import {
  EditorActionsRow,
  EditorHeaderRow,
  EditorSection,
  PresetEditorRoot,
  StalenessNotice,
} from "@/pages/team/components/team.styled";
import type { PresetEditorProps, PresetScopeType } from "@/pages/team/types/team.types";
import type { WatchlistResource } from "@/services/resources.service";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ArrowLeftIcon, InfoIcon } from "@phosphor-icons/react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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

  // Only offer targets that don't already have a preset — one preset per scope is a
  // constraint the picker should respect rather than a confirm-then-fail path.
  const eligibleTeams = useMemo(() => getEligibleTeams(teams, presets), [teams, presets]);
  const eligibleEmployees = useMemo(
    () => getEligibleEmployees(employees, presets),
    [employees, presets],
  );

  const scopeLabel = useMemo(
    () => resolveScopeLabel(scopeType, scopeId, teams, employees),
    [scopeType, scopeId, teams, employees],
  );

  const isDirty = useMemo(
    () =>
      toComparablePresetResources(draftResources) !==
      toComparablePresetResources(preset?.resources ?? []),
    [draftResources, preset],
  );

  const handleScopeTypeChange = (nextScopeType: PresetScopeType) => {
    setScopeType(nextScopeType);
    setScopeId(null);
  };

  const handleAddResource = (incoming: WatchlistResource) => {
    const existing = draftResources.find((resource) => resource.arn === incoming.arn);

    if (existing) {
      const mergedActions = [...new Set([...existing.actions, ...incoming.actions])];
      setDraftResources(
        draftResources.map((resource) =>
          resource.arn === incoming.arn ? { ...resource, actions: mergedActions } : resource,
        ),
      );
    } else {
      setDraftResources([...draftResources, incoming]);
    }
  };

  const handleRemoveResource = (arn: string) => {
    setDraftResources(draftResources.filter((resource) => resource.arn !== arn));
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
        isCreateMode
          ? t("team.presets.createSuccess", { scopeLabel })
          : t("team.presets.editSuccess"),
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
          <PresetScopeSelector
            scopeType={scopeType}
            scopeId={scopeId}
            name={name}
            eligibleTeams={eligibleTeams}
            eligibleEmployees={eligibleEmployees}
            onScopeTypeChange={handleScopeTypeChange}
            onScopeIdChange={setScopeId}
            onNameChange={setName}
          />
        ) : (
          <PresetScopeSummary
            scopeType={preset.scopeType}
            scopeLabel={scopeLabel}
            name={name}
            onNameChange={setName}
          />
        )}
      </EditorSection>

      <PresetResourcePicker
        draftResources={draftResources}
        onDraftChange={setDraftResources}
        onAddResource={handleAddResource}
        onRemoveResource={handleRemoveResource}
      />

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
