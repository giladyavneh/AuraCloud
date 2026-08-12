import HostAddress from "@/components/hostAddress/HostAddress";
import { MonoText } from "@/components/monoText/components/monoText.styled";
import StatusTag from "@/components/statusTag/StatusTag";
import { formatTimestamp } from "@/helpers/time.helpers";
import {
  getConnectionOwnerName,
  isExternalConnection,
  resolveConnectionOrigin,
} from "@/pages/team/helpers/team.helpers";
import type { CompanyConnectedClient } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { PlugsIcon } from "@phosphor-icons/react";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const ACTIONS_COLUMN_SIZE = 48;

interface AiAccessColumnActions {
  currentCustomerId: string | undefined;
  onDisconnect: (grant: CompanyConnectedClient) => void;
  isRowPending: (grantId: string) => boolean;
}

/** Column definitions for the company AI-access table. */
export const useAiAccessColumns = ({
  currentCustomerId,
  onDisconnect,
  isRowPending,
}: AiAccessColumnActions): MRT_ColumnDef<CompanyConnectedClient>[] => {
  const { t } = useTranslation();
  const theme = useTheme();

  const originOf = (grant: CompanyConnectedClient) =>
    resolveConnectionOrigin(grant, t("team.aiAccess.unknownAddress"));

  return useMemo<MRT_ColumnDef<CompanyConnectedClient>[]>(
    () => [
      {
        id: "employee",
        header: t("team.aiAccess.columns.employee"),
        // Name and email in one accessor, so the search box matches either.
        accessorFn: (grant) => `${getConnectionOwnerName(grant)} ${grant.employee.email}`,
        Cell: ({ row }) => {
          const grant = row.original;

          return (
            <Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: theme.spacing(1) }}>
                <Typography variant="body2" color="textPrimary">
                  {getConnectionOwnerName(grant)}
                </Typography>

                {grant.employee.id === currentCustomerId && (
                  <Typography variant="caption" color="textDisabled">
                    {t("team.aiAccess.you")}
                  </Typography>
                )}

              </Box>

              <Typography variant="caption" color="textSecondary">
                {grant.employee.email}
              </Typography>

            </Box>
          );
        },
      },
      {
        id: "address",
        header: t("team.aiAccess.columns.address"),
        accessorFn: (grant) => originOf(grant),
        Cell: ({ row }) => {
          const grant = row.original;
          const extraAddresses = grant.redirectUris.length - 1;

          return (
            // inline-flex, so the address does not stretch the tag away from it.
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: theme.spacing(2),
                maxWidth: "100%",
              }}
            >
              <MonoText variant="body2">
                <HostAddress host={originOf(grant)} />
              </MonoText>

              {/* Only the exception is tagged — a badge on every row is a badge nobody reads. */}
              {isExternalConnection(grant) && (
                <StatusTag variant="warning" label={t("team.aiAccess.externalTag")} />
              )}

              {extraAddresses > 0 && (
                <Typography variant="caption" color="textSecondary">
                  {t("team.aiAccess.extraAddresses", { count: extraAddresses })}
                </Typography>
              )}

            </Box>
          );
        },
      },
      {
        accessorKey: "clientName",
        header: t("team.aiAccess.columns.app"),
        // Out of the search corpus: the box promises person or address, and a
        // self-reported name is the one field an attacker picks.
        enableGlobalFilter: false,
        Cell: ({ cell }) => {
          const clientName = cell.getValue<string | null>();

          if (!clientName) {
            return (
              <Typography variant="body2" color="textDisabled" sx={{ fontStyle: "italic" }}>
                {t("team.aiAccess.unnamedApp")}
              </Typography>
            );
          }

          return (
            <Typography variant="body2" color="textSecondary">
              {clientName}
            </Typography>
          );
        },
      },
      {
        accessorKey: "connectedAt",
        header: t("team.aiAccess.columns.connected"),
        // The filter reads the raw ISO string, so "2026" would match every row.
        enableGlobalFilter: false,
        Cell: ({ cell }) => (
          <Typography variant="body2" color="textSecondary">
            {formatTimestamp(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        accessorKey: "lastUsedAt",
        header: t("team.aiAccess.columns.lastUsed"),
        enableGlobalFilter: false,
        Cell: ({ cell }) => {
          const lastUsedAt = cell.getValue<string | null>();

          return (
            <Typography variant="body2" color="textSecondary">
              {lastUsedAt ? formatTimestamp(lastUsedAt) : t("team.aiAccess.neverUsed")}
            </Typography>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: ACTIONS_COLUMN_SIZE,
        Cell: ({ row }) => {
          const grant = row.original;

          return (
            <Tooltip title={t("team.aiAccess.disconnect")}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isRowPending(grant.id)}
                  onClick={() => onDisconnect(grant)}
                  // Two people can connect from the same address, so the name is part of
                  // what makes this button distinguishable in a control list.
                  aria-label={t("team.aiAccess.disconnectAria", {
                    name: getConnectionOwnerName(grant),
                    origin: originOf(grant),
                  })}
                >
                  <PlugsIcon size={theme.iconSize.xs} />
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    // originOf closes over t, which is listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, theme, currentCustomerId, onDisconnect, isRowPending],
  );
};
