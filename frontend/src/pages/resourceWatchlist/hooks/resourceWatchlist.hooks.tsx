import AwsServiceIcon from "@/components/awsServiceIcon/AwsServiceIcon";
import { inferServiceFromArn } from "@/helpers/arn.helpers";
import type { WatchlistResource } from "@/services/resources.service";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { type MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const MAX_VISIBLE_CHIPS = 3;

export const useWatchlistTableColumns =
  (): MRT_ColumnDef<WatchlistResource>[] => {
    const { t } = useTranslation();
    const theme = useTheme();

    return useMemo<MRT_ColumnDef<WatchlistResource>[]>(
      () => [
        {
          accessorKey: "arn",
          header: t("resourceWatchlist.columns.resource"),
          Cell: ({ row }) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AwsServiceIcon
                service={inferServiceFromArn(row.original.arn)}
                size={theme.iconSize.lg}
              />

              <Typography
                variant="body2"
                color="textPrimary"
                sx={{ wordBreak: "break-all" }}
              >
                {row.original.arn}
              </Typography>
            </Box>
          ),
        },
        {
          accessorKey: "actions",
          header: t("resourceWatchlist.columns.actions"),
          // Stringify array so global filter can match action names
          filterFn: (row, _id, filterValue: string) =>
            row.original.actions.some((a) =>
              a.toLowerCase().includes(filterValue.toLowerCase()),
            ),
          Cell: ({ row }) => {
            const actions = row.original.actions;
            const visible = actions.slice(0, MAX_VISIBLE_CHIPS);
            const overflow = actions.length - MAX_VISIBLE_CHIPS;

            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, paddingBlock: 1 }}>
                {actions.length === 0 ? (
                  <Typography variant="caption" color="textDisabled">
                    —
                  </Typography>
                ) : (
                  <>
                    {visible.map((action) => (
                      <Chip key={action} label={action} size="small" />
                    ))}
                    {overflow > 0 && (
                      <Tooltip
                        title={
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            {actions.slice(MAX_VISIBLE_CHIPS).map((action) => (
                              <Typography key={action} variant="caption">
                                {action}
                              </Typography>
                            ))}
                          </Box>
                        }
                        arrow
                      >
                        <Chip label={`+${overflow}`} size="small" variant="outlined" sx={{ cursor: "pointer" }} />
                      </Tooltip>
                    )}
                  </>
                )}
              </Box>
            );
          },
        },
      ],
      [t, theme.iconSize.lg],
    );
  };
