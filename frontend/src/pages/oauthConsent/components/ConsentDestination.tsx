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
  MonoAddress,
  MonoSegment,
  MonoValue,
  PanelHeader,
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
      <DestinationPanel
        ref={panelRef}
        redirectClass={redirectClass}
        role="group"
        tabIndex={-1}
        aria-labelledby={DESTINATION_LABEL_ELEMENT_ID}
        aria-describedby={DESTINATION_HEADLINE_ELEMENT_ID}
      >
        {/* The origin, not the raw URI: `http://login.auracloud.com@evil.io/cb` has its
            userinfo stripped by URL, so a screen reader hears the host that actually
            receives the code. */}
        <VisuallyHidden id={DESTINATION_URL_ELEMENT_ID}>
          {url?.origin ?? redirectUri}
        </VisuallyHidden>

        {/* A loopback destination cannot leak the code off this machine, so it gets a plain
            address. The split emphasis and the warning only earn their space when a domain
            is involved and the user actually has something to check. */}
        {redirectClass === 'local' ? (
          <>
            <Typography
              id={DESTINATION_LABEL_ELEMENT_ID}
              variant="subtitle1"
              component="h2"
              color="textPrimary"
            >
              {t('consent.destination.sectionLabel')}
            </Typography>

            <CopyField
              label={t('consent.destination.addressLabel')}
              value={redirectUri}
              copyLabel={t('consent.destination.copy')}
              copiedLabel={t('consent.destination.copied')}
            >
              <MonoValue>{redirectUri}</MonoValue>
            </CopyField>

            <Typography
              id={DESTINATION_HEADLINE_ELEMENT_ID}
              variant="caption"
              color="textSecondary"
            >
              {t('consent.destination.headline.local')}
            </Typography>

          </>
        ) : (
          <>
            <PanelHeader>
              <Typography
                id={DESTINATION_LABEL_ELEMENT_ID}
                variant="subtitle1"
                component="h2"
                color="textPrimary"
              >
                {t('consent.destination.sectionLabel')}
              </Typography>

              <StatusTag
                variant={TAG_VARIANTS.remote}
                label={t('consent.destination.tag.remote')}
              />

            </PanelHeader>

            <CopyField
              label={t('consent.destination.addressLabel')}
              value={redirectUri}
              copyLabel={t('consent.destination.copy')}
              copiedLabel={t('consent.destination.copied')}
            >
              <MonoAddress aria-hidden="true">
                <MonoSegment isEmphasised={false}>
                  {url ? `${url.protocol}//${hostLabels.dim}` : ''}
                </MonoSegment>
                <MonoSegment isEmphasised>{hostLabels.emphasised}</MonoSegment>
                <MonoSegment isEmphasised={false}>{url ? formatRedirectPath(url) : ''}</MonoSegment>
              </MonoAddress>
            </CopyField>

            <Typography
              id={DESTINATION_HEADLINE_ELEMENT_ID}
              variant="body2"
              color={HEADLINE_COLORS.remote}
            >
              {t('consent.destination.headline.remote')}
            </Typography>

            <Typography variant="caption" color="textSecondary">
              {t('consent.destination.hint.remote')}
            </Typography>

          </>
        )}

      </DestinationPanel>

    </SectionBlock>
  );
};

export default ConsentDestination;
