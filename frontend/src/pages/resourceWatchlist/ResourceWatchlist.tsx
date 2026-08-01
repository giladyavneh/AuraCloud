import { useUserResourceWatchlist } from "@/hooks/resources.hooks";
import ResourceWatchlistContent from "@/pages/resourceWatchlist/components/ResourceWatchlistContent";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";

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

  // Remount on identity change so the draft state resets with a different watchlist
  return <ResourceWatchlistContent key={watchlist?._id ?? "new"} watchlist={watchlist} />;
};

export default ResourceWatchlist;
