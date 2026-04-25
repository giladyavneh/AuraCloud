import { useQuery } from '@tanstack/react-query';
import { fetchUserResourceWatchlist } from '@/services/resources.service';

const RESOURCE_WATCHLIST_QUERY_KEY = ['userResourceWatchlist'] as const;

export const useUserResourceWatchlist = () =>
  useQuery({
    queryKey: RESOURCE_WATCHLIST_QUERY_KEY,
    queryFn: fetchUserResourceWatchlist,
  });
