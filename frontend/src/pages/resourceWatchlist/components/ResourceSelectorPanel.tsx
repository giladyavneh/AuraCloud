import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ArrowCounterClockwiseIcon, ListBulletsIcon } from "@phosphor-icons/react";
import AddResourceForm from "@/pages/resourceWatchlist/components/AddResourceForm";
import WatchlistTable from "@/pages/resourceWatchlist/components/WatchlistTable";
import {
  LeftPanel,
  PanelCard,
  PanelEmptyState,
} from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type {
  ResourceSelectorPanelProps,
  WatchlistResource,
} from "@/pages/resourceWatchlist/types/resourceWatchlist.types";

const ResourceSelectorPanel: React.FC<ResourceSelectorPanelProps> = ({
  draftResources,
  onDraftChange,
  onSave,
  onCancel,
  onResetToPreset,
  isSaving,
  isDirty,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleAdd = (incoming: WatchlistResource) => {
    const existing = draftResources.find((resource) => resource.arn === incoming.arn);

    if (existing) {
      const mergedActions = [...new Set([...existing.actions, ...incoming.actions])];
      onDraftChange(
        draftResources.map((resource) =>
          resource.arn === incoming.arn ? { ...resource, actions: mergedActions } : resource,
        ),
      );
    } else {
      onDraftChange([...draftResources, incoming]);
    }
  };

  const handleRemove = (arn: string) => {
    onDraftChange(draftResources.filter((resource) => resource.arn !== arn));
  };

  return (
    <LeftPanel>
      <PanelCard>
        <Typography variant="subtitle1" color="textPrimary">
          {t("resourceWatchlist.addResource")}
        </Typography>

        <AddResourceForm onAdd={handleAdd} />
      </PanelCard>

      <PanelCard sx={{ flex: 1, overflow: "auto" }}>
        {draftResources.length === 0 ? (
          <PanelEmptyState>
            <ListBulletsIcon size={36} color={theme.palette.text.disabled} />

            <Box>
              <Typography variant="subtitle1" color="textPrimary">
                {t("resourceWatchlist.emptyState.title")}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ marginTop: 0.5 }}
              >
                {t("resourceWatchlist.emptyState.description")}
              </Typography>
            </Box>
          </PanelEmptyState>
        ) : (
          <WatchlistTable resources={draftResources} onRemove={handleRemove} />
        )}
      </PanelCard>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: theme.spacing(2),
        }}
      >
        <Tooltip title={t("resourceWatchlist.resetToPresetTooltip")}>
          <Button
            variant="text"
            color="inherit"
            onClick={onResetToPreset}
            disabled={isSaving}
            size="medium"
            startIcon={<ArrowCounterClockwiseIcon size={theme.iconSize.xs} />}
          >
            {t("resourceWatchlist.resetToPreset")}
          </Button>
        </Tooltip>

        <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
          {isDirty && (
            <Typography variant="caption" color="warning.main">
              {t("resourceWatchlist.unsavedChanges")}
            </Typography>
          )}

          <Button
            variant="text"
            color="inherit"
            onClick={onCancel}
            disabled={!isDirty || isSaving}
            size="medium"
          >
            {t("resourceWatchlist.cancel")}
          </Button>

          <Button
            variant={isDirty ? "contained" : "outlined"}
            color="primary"
            onClick={onSave}
            disabled={isSaving}
            size="medium"
            startIcon={
              isSaving ? (
                <CircularProgress size={theme.iconSize.xs} color="inherit" />
              ) : undefined
            }
          >
            {isSaving
              ? t("resourceWatchlist.saving")
              : t("resourceWatchlist.save")}
          </Button>
        </Box>
      </Box>
    </LeftPanel>
  );
};

export default ResourceSelectorPanel;
