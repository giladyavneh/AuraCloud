import { useQuery } from '@tanstack/react-query';
import { fetchUserResourceWatchlist } from '@/services/resources.service';
import { QUERY_KEYS } from '@/constants/queryKeys';

export const useUserResourceWatchlist = () =>
  useQuery({
    queryKey: QUERY_KEYS.userResourceWatchlist,
    queryFn: fetchUserResourceWatchlist,
  });
