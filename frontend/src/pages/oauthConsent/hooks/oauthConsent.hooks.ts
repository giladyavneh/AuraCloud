import { useAuth } from '@/context/auth/AuthContext';
import { useApproveAuthorization, useConsentRequestQuery } from '@/hooks/oauth.hooks';
import { classifyRedirectUri, redirectUriHost } from '@/helpers/redirectUri.helpers';
import {
  buildDenyUrl,
  isNotFoundError,
  isStaleRequestError,
  parseConsentParams,
} from '@/pages/oauthConsent/helpers/oauthConsent.helpers';
import type { ConsentViewState } from '@/pages/oauthConsent/types/oauthConsent.types';
import { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

export const useConsentRequest = (): ConsentViewState => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { customer, isLoading: isAuthLoading } = useAuth();
  const [isDenying, setIsDenying] = useState(false);

  const params = useMemo(() => parseConsentParams(searchParams), [searchParams]);
  const isAuthenticated = Boolean(customer);

  const consentQuery = useConsentRequestQuery(
    params?.clientId ?? '',
    params?.redirectUri ?? '',
    isAuthenticated,
  );
  const approve = useApproveAuthorization();

  const handleApprove = () => {
    if (!params) return;

    approve.mutate(params, {
      // A real navigation, not navigate(): the target is an external origin, or a
      // localhost port React Router does not own.
      onSuccess: ({ redirectTo }) => window.location.assign(redirectTo),
    });
  };

  const handleDeny = () => {
    if (!params || !consentQuery.data?.isRedirectUriRegistered) return;

    setIsDenying(true);
    window.location.assign(buildDenyUrl(params.redirectUri, params.state));
  };

  if (isAuthLoading) return { status: 'loading' };

  if (!customer) {
    const target = `${location.pathname}${location.search}`;
    return { status: 'unauthenticated', loginPath: `/login?next=${encodeURIComponent(target)}` };
  }

  if (!params) return { status: 'invalid' };

  const approveError = approve.error?.message ?? null;
  if (approveError && isStaleRequestError(approveError)) return { status: 'invalid' };

  if (consentQuery.isPending) return { status: 'loading' };

  if (consentQuery.error) {
    if (isNotFoundError(consentQuery.error.message)) return { status: 'invalid' };
    return { status: 'loadError', onRetry: () => void consentQuery.refetch() };
  }

  const redirectClass = classifyRedirectUri(
    params.redirectUri,
    consentQuery.data.isRedirectUriRegistered,
  );
  if (redirectClass === 'blocked') return { status: 'invalid' };

  return {
    status: 'ready',
    redirectUri: params.redirectUri,
    redirectClass,
    host: redirectUriHost(params.redirectUri),
    clientName: consentQuery.data.clientName,
    email: customer.email,
    companyName: customer.companyName,
    hasAwsConnected: customer.hasAwsConnected,
    // Never re-enabled after a successful approve: between the response landing and the
    // browser leaving, a second click would mint a second authorization code.
    isApproving: approve.isPending || approve.isSuccess,
    isDenying,
    approveError,
    onApprove: handleApprove,
    onDeny: handleDeny,
  };
};
