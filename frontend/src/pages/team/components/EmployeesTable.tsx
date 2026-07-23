import { WATCHLIST_SEARCH_WIDTH } from "@/constants";
import { useEmployeeColumns } from "@/pages/team/hooks/employees.hooks";
import type { EmployeesTableProps } from "@/pages/team/types/team.types";
import { InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import React from "react";
import { useTranslation } from "react-i18next";

const ROW_ACTIONS_COLUMN_SIZE = 48;

const EmployeesTable: React.FC<EmployeesTableProps> = ({ employees, teams, renderRowActions }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const columns = useEmployeeColumns(teams);

  const table = useMaterialReactTable({
    columns,
    data: employees,
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
    muiSearchTextFieldProps: {
      size: "small",
      variant: "outlined",
      placeholder: t("team.employees.search"),
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
    renderRowActions: ({ row }) => renderRowActions(row.original),
    displayColumnDefOptions: {
      "mrt-row-actions": { header: "", size: ROW_ACTIONS_COLUMN_SIZE },
    },
    muiTablePaperProps: { elevation: 0, sx: { backgroundColor: "transparent" } },
    muiTopToolbarProps: { sx: { backgroundColor: "transparent", paddingInline: 0 } },
    muiTableContainerProps: { sx: { backgroundColor: "transparent" } },
    muiTableHeadCellProps: { sx: { borderColor: theme.palette.border.default } },
    muiTableBodyCellProps: { sx: { borderColor: theme.palette.border.default } },
  });

  return <MaterialReactTable table={table} />;
};

export default EmployeesTable;
