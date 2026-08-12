import { QUERY_KEYS } from '@/constants/queryKeys';
import {
  approveAuthorization,
  fetchCompanyGrants,
  fetchConsentRequest,
  fetchGrants,
  revokeGrant,
} from '@/services/oauth.service';
import type { ApprovePayload } from '@/services/types/oauth.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * An authorization request is a one-shot: refetching it on focus cannot change the
 * answer, and retrying only delays the dead-end screen for a request that is already
 * unanswerable.
 */
export const useConsentRequestQuery = (
  clientId: string,
  redirectUri: string,
  isEnabled: boolean,
) =>
  useQuery({
    queryKey: QUERY_KEYS.consentRequest(clientId, redirectUri),
    queryFn: () => fetchConsentRequest(clientId, redirectUri),
    enabled: isEnabled && Boolean(clientId && redirectUri),
    retry: false,
    staleTime: Infinity,
  });

export const useApproveAuthorization = () =>
  useMutation({
    mutationFn: (payload: ApprovePayload) => approveAuthorization(payload),
  });

/** Default caching, unlike the consent one-shot: a manager can revoke under the user. */
export const useOAuthGrants = () =>
  useQuery({ queryKey: QUERY_KEYS.oauthGrants, queryFn: fetchGrants });

export const useCompanyOAuthGrants = () =>
  useQuery({ queryKey: QUERY_KEYS.oauthCompanyGrants, queryFn: fetchCompanyGrants });

export const useRevokeOAuthGrant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: string) => revokeGrant(grantId),
    // On settle, not on success: a failed disconnect may still have landed server-side.
    // Both lists go stale together — a manager cutting a connection from the team page may
    // be cutting one of their own — and invalidating a key nobody observes costs nothing.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.oauthGrants });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.oauthCompanyGrants });
    },
  });
};
