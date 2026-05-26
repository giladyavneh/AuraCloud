import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import AddResourceForm from "@/pages/resourceWatchlist/components/AddResourceForm";
import WatchlistTable from "@/pages/resourceWatchlist/components/WatchlistTable";
import {
  LeftPanel,
  PanelCard,
} from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type {
  ResourceSelectorPanelProps,
  WatchlistResource,
} from "@/pages/resourceWatchlist/types/resourceWatchlist.types";

const ResourceSelectorPanel: React.FC<ResourceSelectorPanelProps> = ({
  draftResources,
  onDraftChange,
  onSave,
  isSaving,
  isDirty,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleAdd = (resource: WatchlistResource) => {
    onDraftChange([...draftResources, resource]);
  };

  const handleRemove = (arn: string) => {
    onDraftChange(draftResources.filter((r) => r.arn !== arn));
  };

  const existingArns = draftResources.map((r) => r.arn);

  return (
    <LeftPanel>
      <PanelCard>
        <Typography variant="subtitle1" color="textPrimary">
          {t("resourceWatchlist.addResource")}
        </Typography>

        <AddResourceForm
          onAdd={handleAdd}
          existingArns={existingArns}
        />
      </PanelCard>

      <PanelCard sx={{ flex: 1, overflow: "auto" }}>
        <WatchlistTable resources={draftResources} onRemove={handleRemove} />
      </PanelCard>

      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: theme.spacing(2) }}>
        {isDirty && (
          <Typography variant="caption" color="warning.main">
            {t("resourceWatchlist.unsavedChanges")}
          </Typography>
        )}

        <Button
          variant={isDirty ? "contained" : "outlined"}
          color="primary"
          onClick={onSave}
          disabled={isSaving}
          size="medium"
          startIcon={isSaving ? <CircularProgress size={theme.iconSize.xs} color="inherit" /> : undefined}
        >
          {isSaving ? t("resourceWatchlist.saving") : t("resourceWatchlist.save")}
        </Button>
      </Box>
    </LeftPanel>
  );
};

export default ResourceSelectorPanel;
