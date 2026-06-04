import { useAuth } from "@/context/auth/AuthContext";
import type { CurrentUser } from "@/services/types/user.types";

// Adapts the auth customer to the CurrentUser shape consumed by SideMenuProfile
export const useCurrentUser = (): { data: CurrentUser | undefined } => {
  const { customer } = useAuth();
  if (!customer) return { data: undefined };

  return {
    data: {
      _id: customer._id,
      name: `${customer.firstName} ${customer.lastName}`,
      role: customer.roleTitle,
      avatarUrl: undefined,
    },
  };
};
