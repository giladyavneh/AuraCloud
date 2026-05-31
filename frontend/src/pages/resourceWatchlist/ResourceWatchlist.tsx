import {
  useCreateWatchlist,
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
// Accepts watchlist: ResourceWatchlistItem | null.
// null = no watchlist doc exists yet → save calls POST (create).
// non-null = existing doc → save calls PUT (update).

interface ResourceWatchlistContentProps {
  watchlist: ResourceWatchlistItem | null;
}

const sortedSnapshot = (resources: WatchlistResource[]) =>
  [...resources].sort((a, b) => a.arn.localeCompare(b.arn)).map((r) => ({ arn: r.arn, actions: r.actions }));

const ResourceWatchlistContent: React.FC<ResourceWatchlistContentProps> = ({
  watchlist,
}) => {
  const { t } = useTranslation();

  const { mutate: save, isPending: isSaving, isSuccess: isSaved, isError: hasSaveError } = useUpdateWatchlist();
  const { mutate: create, isPending: isCreating, isSuccess: isCreated, isError: hasCreateError } = useCreateWatchlist();

  const isPending = isSaving || isCreating;
  const isSuccess = isSaved || isCreated;
  const isError = hasSaveError || hasCreateError;

  const [draftResources, setDraftResources] = useState<WatchlistResource[]>(
    watchlist?.resources ?? [],
  );
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity: "success" | "error" }>({
    open: false,
    severity: "success",
  });

  const isDirty = useMemo(
    () =>
      JSON.stringify(sortedSnapshot(draftResources)) !==
      JSON.stringify(sortedSnapshot(watchlist?.resources ?? [])),
    [draftResources, watchlist],
  );

  const handleSave = () => {
    if (watchlist) {
      save({ id: watchlist._id, resources: draftResources });
    } else {
      create(draftResources);
    }
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Detect when a pending save settles so the toast fires reliably
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending) {
      if (isSuccess) setSnackbar({ open: true, severity: "success" });
      if (isError) setSnackbar({ open: true, severity: "error" });
    }
    wasPending.current = isPending;
  }, [isPending, isSuccess, isError]);

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
            isSaving={isPending}
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
// Fetches the watchlist and renders content once loading settles.
// watchlist may be null — content handles that gracefully.

const ResourceWatchlist: React.FC = () => {
  const { data: watchlistItems = [], isLoading } = useUserResourceWatchlist();
  const watchlist = watchlistItems[0] ?? null;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", paddingBlock: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return <ResourceWatchlistContent key={watchlist?._id ?? "new"} watchlist={watchlist} />;
};

export default ResourceWatchlist;
