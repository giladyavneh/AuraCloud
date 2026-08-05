import CopyField from '@/components/copyField/CopyField';
import StatusTag from '@/components/statusTag/StatusTag';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';
import {
  DESTINATION_HEADLINE_ELEMENT_ID,
  DESTINATION_LABEL_ELEMENT_ID,
  DESTINATION_URL_ELEMENT_ID,
} from '@/pages/oauthConsent/constants';
import {
  DestinationPanel,
  HostLabel,
  MonoValue,
  OriginLine,
  PathText,
  SchemeText,
  SectionBlock,
  VisuallyHidden,
} from '@/pages/oauthConsent/components/oauthConsent.styled';
import { parseRedirectUri, splitHostLabels } from '@/helpers/redirectUri.helpers';
import { formatRedirectPath } from '@/pages/oauthConsent/helpers/oauthConsent.helpers';
import type {
  ConsentDestinationProps,
  RenderedRedirectClass,
} from '@/pages/oauthConsent/types/oauthConsent.types';
import Typography from '@mui/material/Typography';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const TAG_VARIANTS: Record<RenderedRedirectClass, StatusTagVariant> = {
  local: 'healthy',
  remote: 'warning',
};

const HEADLINE_COLORS: Record<RenderedRedirectClass, 'success.main' | 'warning.main'> = {
  local: 'success.main',
  remote: 'warning.main',
};

const ConsentDestination: React.FC<ConsentDestinationProps> = ({ redirectUri, redirectClass }) => {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  // A screen reader user must hear the destination before reaching any control,
  // and Approve must never be the element focused on load.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  // A class other than blocked means classifyRedirectUri already parsed it and found a host.
  const url = parseRedirectUri(redirectUri);
  const hostLabels = url ? splitHostLabels(url.host) : { dim: '', emphasised: redirectUri };

  return (
    <SectionBlock>
      <Typography
        id={DESTINATION_LABEL_ELEMENT_ID}
        variant="caption"
        color="textSecondary"
        component="h2"
      >
        {t('consent.destination.sectionLabel')}
      </Typography>

      <DestinationPanel
        ref={panelRef}
        redirectClass={redirectClass}
        role="group"
        tabIndex={-1}
        aria-labelledby={DESTINATION_LABEL_ELEMENT_ID}
        aria-describedby={DESTINATION_HEADLINE_ELEMENT_ID}
      >
        <StatusTag
          variant={TAG_VARIANTS[redirectClass]}
          label={t(`consent.destination.tag.${redirectClass}`)}
        />

        <Typography
          id={DESTINATION_HEADLINE_ELEMENT_ID}
          variant="subtitle1"
          color={HEADLINE_COLORS[redirectClass]}
        >
          {t(`consent.destination.headline.${redirectClass}`)}
        </Typography>

        {/* The origin, not the raw URI: `http://login.auracloud.com@evil.io/cb` has its
            userinfo stripped by URL, so a screen reader hears the host that actually
            receives the code. The full URI stays reachable through CopyField below. */}
        <VisuallyHidden id={DESTINATION_URL_ELEMENT_ID}>
          {url?.origin ?? redirectUri}
        </VisuallyHidden>

        <OriginLine aria-hidden="true">
          {url && <SchemeText>{`${url.protocol}//`}</SchemeText>}
          {hostLabels.dim && <HostLabel isEmphasised={false}>{hostLabels.dim}</HostLabel>}
          <HostLabel isEmphasised>{hostLabels.emphasised}</HostLabel>
        </OriginLine>

        {url && <PathText aria-hidden="true">{formatRedirectPath(url)}</PathText>}

        <Typography variant="body2" color="textSecondary">
          {t(`consent.destination.hint.${redirectClass}`)}
        </Typography>

        <CopyField
          label={t('consent.destination.fullUrlLabel')}
          value={redirectUri}
          copyLabel={t('consent.destination.copy')}
          copiedLabel={t('consent.destination.copied')}
        >
          <MonoValue>{redirectUri}</MonoValue>
        </CopyField>

      </DestinationPanel>

    </SectionBlock>
  );
};

export default ConsentDestination;
