import React from "react";
import Typography from "@mui/material/Typography";
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
}) => {
  const { t } = useTranslation();

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
          onSave={onSave}
          isSaving={isSaving}
        />
      </PanelCard>

      <PanelCard sx={{ flex: 1, overflow: "auto" }}>
        <WatchlistTable resources={draftResources} onRemove={handleRemove} />
      </PanelCard>
    </LeftPanel>
  );
};

export default ResourceSelectorPanel;
