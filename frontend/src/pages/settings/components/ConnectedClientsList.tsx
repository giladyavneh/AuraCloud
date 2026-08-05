import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import { ClientList } from "@/pages/settings/components/connectAi.styled";
import ConnectedClientRow from "@/pages/settings/components/ConnectedClientRow";
import type { ConnectedClientsListProps } from "@/pages/settings/types/settings.types";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";

const ConnectedClientsList: React.FC<ConnectedClientsListProps> = ({
  clients,
  isLoading,
  isError,
  onRetry,
  onDisconnect,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (isLoading) return <CircularProgress size={theme.iconSize.sm} />;

  if (isError) {
    return (
      <ErrorRetryRow
        message={t("settings.connectAi.clients.loadError")}
        retryLabel={t("settings.connectAi.clients.retry")}
        onRetry={onRetry}
      />
    );
  }

  if (clients.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        {t("settings.connectAi.clients.empty")}
      </Typography>
    );
  }

  return (
    <ClientList>
      {clients.map((client) => (
        <ConnectedClientRow
          key={client.id}
          client={client}
          onDisconnect={() => onDisconnect(client)}
        />
      ))}

    </ClientList>
  );
};

export default ConnectedClientsList;
