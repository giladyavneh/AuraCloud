import { useQuery } from '@tanstack/react-query';
import { fetchUserResourceWatchlist, fetchUserPermissions } from '@/services/resources.service';
import { QUERY_KEYS } from '@/constants/queryKeys';

export const useUserResourceWatchlist = () =>
  useQuery({
    queryKey: QUERY_KEYS.userResourceWatchlist,
    queryFn: fetchUserResourceWatchlist,
  });

export const useUserPermissions = () =>
  useQuery({
    queryKey: QUERY_KEYS.userPermissions,
    queryFn: fetchUserPermissions,
  });
