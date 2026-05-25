import { QUERY_KEYS } from "@/constants/queryKeys";
import { fetchCurrentUser } from "@/services/user.service";
import type { CurrentUser } from "@/services/types/user.types";
import { useQuery } from "@tanstack/react-query";

// Placeholder until GET /api/user/me is implemented
const MOCK_USER: CurrentUser = {
  _id: "mock-user-1",
  name: "Mike Wazowski",
  role: "Scare Assistant",
};

export const useCurrentUser = () =>
  useQuery<CurrentUser>({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: fetchCurrentUser,
    placeholderData: MOCK_USER,
    // Avoid noisy errors until the endpoint exists
    retry: false,
  });
