import { usePresetColumns } from "@/pages/team/hooks/presets.hooks";
import type { PresetsTableProps } from "@/pages/team/types/team.types";
import { useTheme } from "@mui/material/styles";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import React from "react";

const PresetsTable: React.FC<PresetsTableProps> = ({
  presets,
  teams,
  employees,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();

  const columns = usePresetColumns({ teams, employees, onEdit, onDelete });

  const table = useMaterialReactTable({
    columns,
    data: presets,
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
    muiTablePaperProps: { elevation: 0, sx: { backgroundColor: "transparent" } },
    muiTopToolbarProps: { sx: { backgroundColor: "transparent", paddingInline: 0 } },
    muiTableContainerProps: { sx: { backgroundColor: "transparent" } },
    muiTableHeadCellProps: { sx: { borderColor: theme.palette.border.default } },
    muiTableBodyCellProps: { sx: { borderColor: theme.palette.border.default } },
  });

  return <MaterialReactTable table={table} />;
};

export default PresetsTable;
