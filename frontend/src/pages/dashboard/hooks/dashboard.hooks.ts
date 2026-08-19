import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  REFRESHED_LABEL_MS,
  REFRESH_SPINNER_MIN_MS,
} from "@/pages/dashboard/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type RefreshPhase = "idle" | "refreshing" | "refreshed";

export const useDashboardRefresh = () => {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<RefreshPhase>("idle");

  const refresh = async () => {
    setPhase("refreshing");

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPermissions }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResourceWatchlist }),
      new Promise((resolve) => setTimeout(resolve, REFRESH_SPINNER_MIN_MS)),
    ]);

    setPhase("refreshed");
  };

  useEffect(() => {
    if (phase !== "refreshed") return;

    const timer = setTimeout(() => setPhase("idle"), REFRESHED_LABEL_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  return { phase, refresh };
};
