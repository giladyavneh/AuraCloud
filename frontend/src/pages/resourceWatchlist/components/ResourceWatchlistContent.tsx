import { useCreateWatchlist, useMyPresetResources, useUpdateWatchlist } from "@/hooks/resources.hooks";
import JsonEditorPanel from "@/pages/resourceWatchlist/components/JsonEditorPanel";
import ResourceSelectorPanel from "@/pages/resourceWatchlist/components/ResourceSelectorPanel";
import { toComparableResources } from "@/pages/resourceWatchlist/helpers/resourceWatchlist.helpers";
import {
  PageHeader,
  PageRoot,
  PageTitleBlock,
} from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type {
  ResourceWatchlistContentProps,
  WatchlistResource,
} from "@/pages/resourceWatchlist/types/resourceWatchlist.types";
import { Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const ResourceWatchlistContent: React.FC<ResourceWatchlistContentProps> = ({ watchlist }) => {
  const { t } = useTranslation();

  const { mutate: save, isPending: isSaving } = useUpdateWatchlist();
  const { mutate: create, isPending: isCreating } = useCreateWatchlist();
  const { data: presetResources = [] } = useMyPresetResources();

  const [draftResources, setDraftResources] = useState<WatchlistResource[]>(
    watchlist?.resources ?? [],
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: "success" | "error";
  }>({ open: false, severity: "success" });

  const isPending = isSaving || isCreating;

  const isDirty = useMemo(
    () =>
      JSON.stringify(toComparableResources(draftResources)) !==
      JSON.stringify(toComparableResources(watchlist?.resources ?? [])),
    [draftResources, watchlist],
  );

  const mutationCallbacks = {
    onSuccess: () => setSnackbar({ open: true, severity: "success" }),
    onError: () => setSnackbar({ open: true, severity: "error" }),
  };

  const handleSave = () => {
    if (watchlist) {
      save({ id: watchlist._id, resources: draftResources }, mutationCallbacks);
    } else {
      create(draftResources, mutationCallbacks);
    }
  };

  // Reverts the whole draft — the table and the JSON editor are two views of
  // this one piece of state, so they revert together.
  const handleCancel = () => setDraftResources(watchlist?.resources ?? []);

  // No preset resolves to an empty list, which clears the draft. Saving is still
  // a separate step, so this stays reversible via Cancel.
  const handleResetToPreset = () => setDraftResources(presetResources);

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <PageRoot>
      <PageHeader>
        <PageTitleBlock>
          <Typography variant="h5" color="textPrimary">
            {t("resourceWatchlist.title")}
          </Typography>

          <Typography variant="body2" color="textSecondary">
            {t("resourceWatchlist.subtitle")}
          </Typography>
        </PageTitleBlock>
      </PageHeader>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="standard">
          {snackbar.severity === "success"
            ? t("resourceWatchlist.saveSuccess")
            : t("resourceWatchlist.saveError")}
        </Alert>
      </Snackbar>

      <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, lg: 7 }} sx={{ height: "100%" }}>
          <ResourceSelectorPanel
            draftResources={draftResources}
            onDraftChange={setDraftResources}
            onSave={handleSave}
            onCancel={handleCancel}
            onResetToPreset={handleResetToPreset}
            isSaving={isPending}
            isDirty={isDirty}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }} sx={{ height: "100%" }}>
          <JsonEditorPanel draftResources={draftResources} onDraftChange={setDraftResources} />
        </Grid>
      </Grid>
    </PageRoot>
  );
};

export default ResourceWatchlistContent;
