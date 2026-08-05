import {
  ACKNOWLEDGE_ELEMENT_ID,
  DESTINATION_URL_ELEMENT_ID,
} from '@/pages/oauthConsent/constants';
import {
  ActionsRow,
  SectionBlock,
  SoftDisabledButton,
} from '@/pages/oauthConsent/components/oauthConsent.styled';
import type { ConsentActionsProps } from '@/pages/oauthConsent/types/oauthConsent.types';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ConsentActions: React.FC<ConsentActionsProps> = ({
  redirectClass,
  host,
  isApproving,
  isDenying,
  onApprove,
  onDeny,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const needsAcknowledgement = redirectClass === 'remote';
  const isBlockedByAcknowledgement = needsAcknowledgement && !isAcknowledged;
  const isBusy = isApproving || isDenying;

  // Ticking the checkbox is the only thing that unblocks approval, so a reflexive click
  // lands on a button that does nothing and the reader is sent back to the host.
  const handleApprove = () => {
    if (isBlockedByAcknowledgement) return;
    onApprove();
  };

  const approveDescribedBy = isBlockedByAcknowledgement
    ? `${DESTINATION_URL_ELEMENT_ID} ${ACKNOWLEDGE_ELEMENT_ID}`
    : DESTINATION_URL_ELEMENT_ID;

  return (
    <SectionBlock>
      {needsAcknowledgement && (
        <FormControlLabel
          control={
            <Checkbox
              checked={isAcknowledged}
              onChange={(event) => setIsAcknowledged(event.target.checked)}
              slotProps={{ input: { 'aria-required': true } }}
            />
          }
          label={
            // The id sits on the label, not the Checkbox: MUI puts a Checkbox id on the
            // inner input, and description resolution from a bare form control is not
            // reliable across assistive tech.
            <Typography
              id={ACKNOWLEDGE_ELEMENT_ID}
              variant="body2"
              color="textSecondary"
            >
              {t('consent.acknowledge', { host })}
            </Typography>
          }
        />
      )}

      <ActionsRow>
        <Button variant="text" onClick={onDeny} disabled={isBusy}>
          {isDenying ? t('consent.denying') : t('consent.deny')}
        </Button>

        <SoftDisabledButton
          variant="contained"
          isSoftDisabled={isBlockedByAcknowledgement}
          aria-disabled={isBlockedByAcknowledgement || undefined}
          aria-describedby={approveDescribedBy}
          disabled={isBusy}
          onClick={handleApprove}
          startIcon={
            isApproving && <CircularProgress size={theme.iconSize.xs} color="inherit" />
          }
        >
          {isApproving ? t('consent.approving') : t('consent.approve')}
        </SoftDisabledButton>

      </ActionsRow>

    </SectionBlock>
  );
};

export default ConsentActions;
