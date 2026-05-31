import {
  useUpdateWatchlist,
  useUserResourceWatchlist,
} from "@/hooks/resources.hooks";
import JsonEditorPanel from "@/pages/resourceWatchlist/components/JsonEditorPanel";
import ResourceSelectorPanel from "@/pages/resourceWatchlist/components/ResourceSelectorPanel";
import {
  PageHeader,
  PageRoot,
  PageTitleBlock,
} from "@/pages/resourceWatchlist/components/resourceWatchlist.styled";
import type { WatchlistResource } from "@/pages/resourceWatchlist/types/resourceWatchlist.types";
import type { ResourceWatchlistItem } from "@/services/types/resources.types";
import { Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ─── Inner content component ─────────────────────────────────────────────────
// Receives a guaranteed watchlist document so useState can be seeded
// synchronously from the prop — no useEffect needed.
// The key={watchlist._id} on this component (set by the shell below) ensures
// state resets automatically if the watchlist document ever changes.

interface ResourceWatchlistContentProps {
  watchlist: ResourceWatchlistItem;
}

const sortedSnapshot = (resources: WatchlistResource[]) =>
  [...resources].sort((a, b) => a.arn.localeCompare(b.arn)).map((r) => ({ arn: r.arn, actions: r.actions }));

const ResourceWatchlistContent: React.FC<ResourceWatchlistContentProps> = ({
  watchlist,
}) => {
  const { t } = useTranslation();
  const { mutate: save, isPending: isSaving, isSuccess: isSaved, isError: hasSaveError } = useUpdateWatchlist();

  const [draftResources, setDraftResources] = useState<WatchlistResource[]>(
    watchlist.resources,
  );
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: "success" | "error" }>({
    open: false,
    severity: "success",
  });

  const isDirty = useMemo(
    () => JSON.stringify(sortedSnapshot(draftResources)) !== JSON.stringify(sortedSnapshot(watchlist.resources)),
    [draftResources, watchlist.resources],
  );

  const handleSave = () => {
    save({ id: watchlist._id, resources: draftResources });
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Detect when a pending save settles so the toast fires reliably
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isSaving) {
      if (isSaved) setSnackbar({ open: true, severity: "success" });
      if (hasSaveError) setSnackbar({ open: true, severity: "error" });
    }
    wasPending.current = isSaving;
  }, [isSaving, isSaved, hasSaveError]);

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
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled">
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
            isSaving={isSaving}
            isDirty={isDirty}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }} sx={{ height: "100%" }}>
          <JsonEditorPanel
            draftResources={draftResources}
            onDraftChange={setDraftResources}
          />
        </Grid>
      </Grid>
    </PageRoot>
  );
};

// ─── Shell component ──────────────────────────────────────────────────────────
// Fetches the watchlist and waits until data is available before rendering
// the content. key={watchlist._id} resets child state if the document changes.

const ResourceWatchlist: React.FC = () => {
  const { t } = useTranslation();
  const { data: watchlistItems = [], isLoading } = useUserResourceWatchlist();
  const watchlist = watchlistItems[0];

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", paddingBlock: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!watchlist) {
    return (
      <Box sx={{ paddingBlock: 8, paddingInline: 4 }}>
        <Typography variant="body2" color="textSecondary">
          {t("resourceWatchlist.noWatchlist")}
        </Typography>
      </Box>
    );
  }

  return <ResourceWatchlistContent key={watchlist._id} watchlist={watchlist} />;
};

export default ResourceWatchlist;
