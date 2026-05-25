import AwsServiceIcon from "@/components/awsServiceIcon/AwsServiceIcon";
import { inferServiceFromArn } from "@/helpers/arn.helpers";
import type { WatchlistResource } from "@/services/resources.service";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { type MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useWatchlistTableColumns =
  (): MRT_ColumnDef<WatchlistResource>[] => {
    const { t } = useTranslation();

    return useMemo<MRT_ColumnDef<WatchlistResource>[]>(
      () => [
        {
          accessorKey: "arn",
          header: t("resourceWatchlist.columns.resource"),
          Cell: ({ row }) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AwsServiceIcon
                service={inferServiceFromArn(row.original.arn)}
                size={32}
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
          Cell: ({ row }) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {row.original.actions.length === 0 ? (
                <Typography variant="caption" color="textDisabled">
                  —
                </Typography>
              ) : (
                row.original.actions.map((action) => (
                  <Chip key={action} label={action} size="small" />
                ))
              )}
            </Box>
          ),
        },
      ],
      [t],
    );
  };
