import React from "react";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import { useWatchlistTableColumns } from "@/pages/resourceWatchlist/hooks/resourceWatchlist.hooks";
import type { WatchlistTableProps } from "@/pages/resourceWatchlist/types/resourceWatchlist.types";

const WatchlistTable: React.FC<WatchlistTableProps> = ({
  resources,
  onRemove,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const columns = useWatchlistTableColumns();

  const table = useMaterialReactTable({
    columns,
    data: resources,

    // ── Features ──────────────────────────────────────────────
    enableGlobalFilter: true,
    initialState: { showGlobalFilter: true },
    enableColumnFilters: false,
    enableSorting: false,
    enablePagination: false,
    enableColumnActions: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableBottomToolbar: false,
    enableHiding: false,
    enableRowActions: true,
    positionActionsColumn: "last",
    positionGlobalFilter: "right",

    // ── Search field ──────────────────────────────────────────
    muiSearchTextFieldProps: {
      size: "small",
      variant: "outlined",
      placeholder: t("resourceWatchlist.search"),
      slotProps: {
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <MagnifyingGlassIcon />
            </InputAdornment>
          ),
          sx: { width: 260 },
        },
      },
    },

    // ── Empty state ───────────────────────────────────────────
    renderEmptyRowsFallback: () => (
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ paddingBlock: 3, paddingInline: 2 }}
      >
        {t("resourceWatchlist.noResources")}
      </Typography>
    ),

    // ── Row actions (remove button) ───────────────────────────
    renderRowActions: ({ row }) => (
      <IconButton
        size="small"
        color="error"
        onClick={() => onRemove(row.original.arn)}
        aria-label={t("resourceWatchlist.remove")}
      >
        <TrashIcon size={16} />
      </IconButton>
    ),
    displayColumnDefOptions: {
      "mrt-row-actions": { header: "", size: 48 },
    },

    // ── Styling to match dark theme ───────────────────────────
    muiTableHeadCellProps: {
      sx: { borderColor: theme.palette.border.strong },
    },
    muiTableBodyCellProps: ({ row, table }) => {
      const isLastRow = row.index === table.getRowModel().rows.length - 1;

      return {
        sx: {
          borderColor: theme.palette.border.strong,
          borderBottom: isLastRow ? "none" : undefined,
        },
      };
    },
  });

  return <MaterialReactTable table={table} />;
};

export default WatchlistTable;
