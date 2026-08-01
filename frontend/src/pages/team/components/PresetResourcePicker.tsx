import AddResourceForm from "@/pages/resourceWatchlist/components/AddResourceForm";
import JsonEditorPanel from "@/pages/resourceWatchlist/components/JsonEditorPanel";
import WatchlistTable from "@/pages/resourceWatchlist/components/WatchlistTable";
import {
  LeftPanel,
  PanelCard,
  PanelEmptyState,
} from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type { PresetResourcePickerProps } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ListBulletsIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

const EMPTY_STATE_ICON_SIZE = 36;

/** The preset's resource list — reuses the watchlist picker so both stay in step. */
const PresetResourcePicker: React.FC<PresetResourcePickerProps> = ({
  draftResources,
  onDraftChange,
  onAddResource,
  onRemoveResource,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
      <Grid size={{ xs: 12, lg: 7 }} sx={{ height: "100%" }}>
        <LeftPanel>
          <PanelCard>
            <Typography variant="subtitle1" color="textPrimary">
              {t("resourceWatchlist.addResource")}
            </Typography>

            <AddResourceForm onAdd={onAddResource} />
          </PanelCard>

          <PanelCard sx={{ flex: 1, overflow: "auto" }}>
            {draftResources.length === 0 ? (
              <PanelEmptyState>
                <ListBulletsIcon
                  size={EMPTY_STATE_ICON_SIZE}
                  color={theme.palette.text.disabled}
                />

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
              <WatchlistTable resources={draftResources} onRemove={onRemoveResource} />
            )}
          </PanelCard>
        </LeftPanel>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }} sx={{ height: "100%" }}>
        <JsonEditorPanel draftResources={draftResources} onDraftChange={onDraftChange} />
      </Grid>
    </Grid>
  );
};

export default PresetResourcePicker;
