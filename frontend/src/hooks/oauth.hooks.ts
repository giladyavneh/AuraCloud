import { QUERY_KEYS } from '@/constants/queryKeys';
import { approveAuthorization, fetchConsentRequest } from '@/services/oauth.service';
import type { ApprovePayload } from '@/services/types/oauth.types';
import { useMutation, useQuery } from '@tanstack/react-query';

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
