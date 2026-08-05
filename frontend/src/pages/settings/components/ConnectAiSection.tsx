import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog";
import FeedbackSnackbar from "@/components/feedbackSnackbar/FeedbackSnackbar";
import type { SnackbarState } from "@/components/feedbackSnackbar/types/feedbackSnackbar.types";
import { useAuth } from "@/context/auth/AuthContext";
import { redirectUriHost } from "@/helpers/redirectUri.helpers";
import { formatTimestamp } from "@/helpers/time.helpers";
import { useOAuthGrants, useRevokeOAuthGrant } from "@/hooks/oauth.hooks";
import ConnectAiCommand from "@/pages/settings/components/ConnectAiCommand";
import ConnectedClientsList from "@/pages/settings/components/ConnectedClientsList";
import {
  SectionDivider,
  SectionHeader,
  SettingsCard,
} from "@/pages/settings/components/settings.styled";
import type { ConnectedClient } from "@/services/types/oauth.types";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const ConnectAiSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { customer } = useAuth();

  const { data: clients = [], isLoading, isError, refetch } = useOAuthGrants();
  const revokeGrant = useRevokeOAuthGrant();

  const [clientToDisconnect, setClientToDisconnect] = useState<ConnectedClient | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: "",
  });
  const clientsHeadingRef = useRef<HTMLHeadingElement>(null);
  const [shouldRefocusHeading, setShouldRefocusHeading] = useState(false);

  // The dialog's focus trap wins for as long as it is open, and on close MUI restores
  // focus to the Disconnect button that is unmounting with its row — so the heading can
  // only be focused once the dialog is gone.
  useEffect(() => {
    if (!shouldRefocusHeading || clientToDisconnect !== null) return;

    clientsHeadingRef.current?.focus();
    setShouldRefocusHeading(false);
  }, [shouldRefocusHeading, clientToDisconnect]);

  const displayOrigin = (client: ConnectedClient): string =>
    redirectUriHost(client.redirectUris[0] ?? "") ||
    t("settings.connectAi.clients.unknownAddress");

  const handleConfirmDisconnect = () => {
    if (!clientToDisconnect) return;

    const origin = displayOrigin(clientToDisconnect);
    revokeGrant.mutate(clientToDisconnect.id, {
      onSuccess: () => {
        setSnackbar({
          open: true,
          severity: "success",
          message: t("settings.connectAi.clients.disconnectSuccess", { origin }),
        });
        setShouldRefocusHeading(true);
      },
      // The row stays: the client is still connected, and retry is the same button.
      onError: () =>
        setSnackbar({
          open: true,
          severity: "error",
          message: t("settings.connectAi.clients.disconnectError", { origin }),
        }),
      onSettled: () => setClientToDisconnect(null),
    });
  };

  return (
    <SettingsCard elevation={0}>
      <SectionHeader>
        <Typography variant="subtitle1" color="textPrimary" component="h2">
          {t("settings.connectAi.title")}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t("settings.connectAi.description")}
        </Typography>
      </SectionHeader>

      <SectionDivider />

      {/* Above the command: it decides whether running the command is worth doing. */}
      {customer?.hasAwsConnected === false && (
        <Alert
          severity="warning"
          action={
            <Button variant="text" size="small" onClick={() => navigate("/select-aws-user")}>
              {t("settings.connectAi.awsNotLinked.action")}
            </Button>
          }
        >
          {t("settings.connectAi.awsNotLinked.body")}
        </Alert>
      )}

      <ConnectAiCommand />

      <SectionDivider />

      <Typography
        ref={clientsHeadingRef}
        variant="subtitle2"
        color="textPrimary"
        component="h3"
        tabIndex={-1}
      >
        {t("settings.connectAi.clients.title")}
      </Typography>

      <ConnectedClientsList
        clients={clients}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        onDisconnect={setClientToDisconnect}
      />

      <ConfirmDialog
        open={clientToDisconnect !== null}
        title={t("settings.connectAi.confirmDisconnect.title")}
        body={
          clientToDisconnect
            ? t("settings.connectAi.confirmDisconnect.body", {
                origin: displayOrigin(clientToDisconnect),
                connected: formatTimestamp(clientToDisconnect.connectedAt),
              })
            : ""
        }
        confirmLabel={t("settings.connectAi.confirmDisconnect.confirm")}
        cancelLabel={t("settings.connectAi.confirmDisconnect.cancel")}
        isPending={revokeGrant.isPending}
        onConfirm={handleConfirmDisconnect}
        onClose={() => setClientToDisconnect(null)}
      />

      <FeedbackSnackbar
        state={snackbar}
        onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
      />

    </SettingsCard>
  );
};

export default ConnectAiSection;
