import { KeyValueRow } from "@/components/keyValueRow/components/keyValueRow.styled";
import StatusTag from "@/components/statusTag/StatusTag";
import {
  classifyRedirectUri,
  redirectUriHost,
  splitHostLabels,
} from "@/helpers/redirectUri.helpers";
import { formatTimestamp } from "@/helpers/time.helpers";
import {
  ClientRowDetails,
  MonoText,
} from "@/pages/settings/components/connectAi.styled";
import type { ConnectedClientRowProps } from "@/pages/settings/types/settings.types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";
import { GlobeIcon, LaptopIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

const ConnectedClientRow: React.FC<ConnectedClientRowProps> = ({ client, onDisconnect }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [redirectUri = ""] = client.redirectUris;
  // A grant only exists because a registered address was approved, so `blocked` here can
  // only mean unparseable — which reads as external, so an odd address is loud.
  const isLocal = classifyRedirectUri(redirectUri, true) === "local";
  // A grant outlives its client's registration, which leaves it with no address at all.
  // The row is identified by its address, so a blank one has to say so out loud rather
  // than leave the self-reported name as the only thing naming this connection.
  const origin = redirectUriHost(redirectUri) || t("settings.connectAi.clients.unknownAddress");
  const hostLabels = splitHostLabels(origin);
  const extraAddresses = client.redirectUris.length - 1;

  const timing = t("settings.connectAi.clients.timing", {
    connected: formatTimestamp(client.connectedAt),
    lastUsed: client.lastUsedAt
      ? formatTimestamp(client.lastUsedAt)
      : t("settings.connectAi.clients.neverUsed"),
  });

  return (
    <KeyValueRow>
      <Box sx={{ display: "flex", flexShrink: 0 }}>
        {isLocal ? (
          <LaptopIcon size={theme.iconSize.sm} color={theme.palette.text.disabled} />
        ) : (
          <GlobeIcon size={theme.iconSize.sm} color={theme.palette.warning.main} />
        )}
      </Box>

      <ClientRowDetails>
        <MonoText variant="body2">
          {/* The dim/bright split reads as fragments, so the address is announced whole. */}
          <Box component="span" sx={visuallyHidden}>
            {origin}
          </Box>

          <Box component="span" aria-hidden="true">
            {hostLabels.dim && (
              <MonoText component="span" variant="body2" isDimmed>
                {hostLabels.dim}
              </MonoText>
            )}
            {hostLabels.emphasised}
          </Box>

          {extraAddresses > 0 && (
            <Typography
              component="span"
              variant="caption"
              color="textSecondary"
              sx={{ marginInlineStart: 1 }}
            >
              {t("settings.connectAi.clients.extraAddresses", { count: extraAddresses })}
            </Typography>
          )}
        </MonoText>

        <Typography variant="caption" color="textSecondary">
          {timing}
        </Typography>

        <Typography variant="caption" color="textSecondary">
          {client.clientName
            ? t("settings.connectAi.clients.nameNotice", { clientName: client.clientName })
            : t("settings.connectAi.clients.unnamed")}
        </Typography>

      </ClientRowDetails>

      {/* Only the exception is tagged — a badge on every row is a badge nobody reads. */}
      {!isLocal && (
        <StatusTag variant="warning" label={t("settings.connectAi.clients.externalTag")} />
      )}

      <Button
        variant="text"
        color="error"
        onClick={onDisconnect}
        aria-label={t("settings.connectAi.clients.disconnectAria", { origin })}
      >
        {t("settings.connectAi.clients.disconnect")}
      </Button>

    </KeyValueRow>
  );
};

export default ConnectedClientRow;
