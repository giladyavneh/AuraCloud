import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllResources,
  fetchResourceActions,
  fetchUserPermissions,
  fetchUserResourceWatchlist,
  updateWatchlist,
  type WatchlistResource,
} from '@/services/resources.service';
import { QUERY_KEYS } from '@/constants/queryKeys';

export const useUserResourceWatchlist = () =>
  useQuery({
    queryKey: QUERY_KEYS.userResourceWatchlist,
    queryFn: fetchUserResourceWatchlist,
    refetchInterval: 10_000,
  });

// No userId arg — the backend reads it from the JWT
export const useUserPermissions = () =>
  useQuery({
    queryKey: QUERY_KEYS.userPermissions,
    queryFn: fetchUserPermissions,
    refetchInterval: 10_000,
    // 404 means no Brain data yet — treat as empty, not an error
    retry: (failureCount, error) =>
      error.message.includes('404') ? false : failureCount < 3,
  });

export const useAllResources = () =>
  useQuery({
    queryKey: QUERY_KEYS.allResources,
    queryFn: fetchAllResources,
  });

export const useResourceActions = (arn: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.resourceActions(arn ?? ''),
    queryFn: () => fetchResourceActions(arn!),
    enabled: arn !== null,
  });

export const useUpdateWatchlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resources }: { id: string; resources: WatchlistResource[] }) =>
      updateWatchlist(id, resources),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResourceWatchlist });
    },
  });
};
