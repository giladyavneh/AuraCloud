import { WATCHLIST_SEARCH_WIDTH } from "@/constants";
import { useAiAccessColumns } from "@/pages/team/hooks/aiAccess.hooks";
import type { AiAccessTableProps } from "@/pages/team/types/team.types";
import { InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import React from "react";
import { useTranslation } from "react-i18next";

const AiAccessTable: React.FC<AiAccessTableProps> = ({
  grants,
  currentCustomerId,
  searchInputRef,
  onDisconnect,
  isRowPending,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const columns = useAiAccessColumns({ currentCustomerId, onDisconnect, isRowPending });

  const table = useMaterialReactTable({
    columns,
    data: grants,
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
    positionGlobalFilter: "right",
    muiSearchTextFieldProps: {
      size: "small",
      variant: "outlined",
      placeholder: t("team.aiAccess.search"),
      // The search box survives a row unmounting, which is what makes it somewhere to
      // send focus after a disconnect.
      inputRef: searchInputRef,
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
    muiTablePaperProps: { elevation: 0, sx: { backgroundColor: "transparent" } },
    muiTopToolbarProps: { sx: { backgroundColor: "transparent", paddingInline: 0 } },
    muiTableContainerProps: { sx: { backgroundColor: "transparent" } },
    muiTableHeadCellProps: { sx: { borderColor: theme.palette.border.default } },
    muiTableBodyCellProps: { sx: { borderColor: theme.palette.border.default } },
  });

  return <MaterialReactTable table={table} />;
};

export default AiAccessTable;
