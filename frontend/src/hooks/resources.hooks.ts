import { useQuery } from '@tanstack/react-query';
import { fetchUserResourceWatchlist, fetchUserPermissions } from '@/services/resources.service';
import { QUERY_KEYS } from '@/constants/queryKeys';

export const useUserResourceWatchlist = () =>
  useQuery({
    queryKey: QUERY_KEYS.userResourceWatchlist,
    queryFn: fetchUserResourceWatchlist,
  });

export const useUserPermissions = (userId: string) =>
  useQuery({
    queryKey: [...QUERY_KEYS.userPermissions, userId],
    queryFn: () => fetchUserPermissions(userId),
  });
