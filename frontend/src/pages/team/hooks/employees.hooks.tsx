import StatusTag from "@/components/statusTag/StatusTag";
import { getEmployeeFullName, resolveTeamName } from "@/pages/team/helpers/team.helpers";
import type { Employee, Team } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useEmployeeColumns = (teams: Team[]): MRT_ColumnDef<Employee>[] => {
  const { t } = useTranslation();
  const theme = useTheme();

  return useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        id: "name",
        header: t("team.employees.columns.name"),
        accessorFn: (employee) => getEmployeeFullName(employee),
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2" color="textPrimary">
              {getEmployeeFullName(row.original)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {row.original.roleTitle}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "email",
        header: t("team.employees.columns.email"),
        Cell: ({ cell }) => (
          <Typography variant="body2" color="textSecondary">
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "role",
        header: t("team.employees.columns.role"),
        Cell: ({ row }) => {
          const isManager = row.original.role === "manager";

          return (
            <Chip
              label={
                isManager ? t("team.employees.roleManager") : t("team.employees.roleEmployee")
              }
              size="small"
              variant="outlined"
              sx={{
                borderColor: isManager
                  ? theme.palette.primary.main
                  : theme.palette.border.default,
                color: isManager ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            />
          );
        },
      },
      {
        id: "team",
        header: t("team.employees.columns.team"),
        accessorFn: (employee) => resolveTeamName(employee, teams) ?? "",
        Cell: ({ row }) => {
          const teamName = resolveTeamName(row.original, teams);

          if (!teamName) {
            return (
              <Typography variant="body2" color="textDisabled" sx={{ fontStyle: "italic" }}>
                {t("team.employees.unassigned")}
              </Typography>
            );
          }

          return (
            <Typography variant="body2" color="textSecondary">
              {teamName}
            </Typography>
          );
        },
      },
      {
        id: "awsIdentity",
        header: t("team.employees.columns.awsIdentity"),
        accessorFn: (employee) => employee.hasAwsConnected,
        Cell: ({ row }) => (
          <StatusTag
            variant={row.original.hasAwsConnected ? "healthy" : "stale"}
            label={
              row.original.hasAwsConnected
                ? t("team.employees.linked")
                : t("team.employees.notLinked")
            }
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: t("team.employees.columns.joined"),
        Cell: ({ cell }) => (
          <Typography variant="body2" color="textSecondary">
            {new Date(cell.getValue<string>()).toLocaleDateString()}
          </Typography>
        ),
      },
    ],
    [t, theme, teams],
  );
};
