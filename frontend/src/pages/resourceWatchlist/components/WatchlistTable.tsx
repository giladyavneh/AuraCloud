import { useWatchlistTableColumns } from "@/pages/resourceWatchlist/hooks/resourceWatchlist.hooks";
import type { WatchlistTableProps } from "@/pages/resourceWatchlist/types/resourceWatchlist.types";
import { InputAdornment } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { MagnifyingGlassIcon, TrashIcon } from "@phosphor-icons/react";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import React from "react";
import { WATCHLIST_SEARCH_WIDTH } from "@/constants";
import { useTranslation } from "react-i18next";

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
    // sx is at the TextField top-level (width applies to the whole field),
    // and the start-adornment goes through `slotProps.input` (MUI v6 API).
    muiSearchTextFieldProps: {
      size: "small",
      variant: "outlined",
      placeholder: t("resourceWatchlist.search"),
      slotProps: {
        input: {
          sx: { width: WATCHLIST_SEARCH_WIDTH },
          startAdornment: (
            <InputAdornment position="start">
              <MagnifyingGlassIcon />
            </InputAdornment>
          ),
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
        <TrashIcon size={theme.iconSize.xs} />
      </IconButton>
    ),
    displayColumnDefOptions: {
      "mrt-row-actions": { header: "", size: 48 },
    },

    // ── Styling to match dark theme ───────────────────────────
    muiTablePaperProps: {
      elevation: 0,
      sx: { backgroundColor: "transparent" },
    },
    muiTopToolbarProps: {
      sx: { backgroundColor: "transparent", paddingInline: 0 },
    },
    muiTableContainerProps: {
      sx: { backgroundColor: "transparent" },
    },
    muiTableHeadCellProps: {
      sx: { borderColor: theme.palette.border.default },
    },
    muiTableBodyCellProps: ({ row, table }) => {
      const isLastRow = row.index === table.getRowModel().rows.length - 1;

      return {
        sx: {
          borderColor: theme.palette.border.default,
          borderBottom: isLastRow ? "none" : undefined,
        },
      };
    },
  });

  return <MaterialReactTable table={table} />;
};

export default WatchlistTable;
