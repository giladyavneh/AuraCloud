import { WATCHLIST_SEARCH_WIDTH } from "@/constants";
import { useAuth } from "@/context/auth/AuthContext";
import StatusTag from "@/components/statusTag/StatusTag";
import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog";
import {
  useEmployees,
  useRemoveEmployee,
  useTeams,
  useUpdateEmployeeRole,
  useUpdateEmployeeTeam,
} from "@/hooks/team.hooks";
import { countManagers, resolveTeamName } from "@/pages/team/helpers/team.helpers";
import EmployeeRowMenu from "@/pages/team/components/EmployeeRowMenu";
import InviteCodeSection from "@/pages/settings/components/InviteCodeSection";
import {
  ErrorRow,
  InviteToggleRow,
  LoadingBox,
  SectionCard,
} from "@/pages/team/components/team.styled";
import type { Employee, SnackbarState } from "@/pages/team/types/team.types";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { InputAdornment } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  CaretDownIcon,
  CaretUpIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const EmployeesTab: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { customer } = useAuth();

  const [showInvite, setShowInvite] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Employee | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: "",
  });

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
    error: employeesQueryError,
    refetch: refetchEmployees,
  } = useEmployees();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();

  const roleMutation = useUpdateEmployeeRole();
  const teamMutation = useUpdateEmployeeTeam();
  const removeMutation = useRemoveEmployee();

  const managerCount = countManagers(employees);

  const showSnackbar = (severity: "success" | "error", message: string) =>
    setSnackbar({ open: true, severity, message });

  const isRowPending = (employeeId: string) =>
    (roleMutation.isPending && roleMutation.variables?.id === employeeId) ||
    (teamMutation.isPending && teamMutation.variables?.id === employeeId) ||
    (removeMutation.isPending && removeMutation.variables === employeeId);

  const handleChangeRole = (employee: Employee, role: "manager" | "employee") => {
    const name = `${employee.firstName} ${employee.lastName}`;
    roleMutation.mutate(
      { id: employee._id, role },
      {
        onSuccess: () => showSnackbar("success", t("team.employees.roleChangeSuccess", { name })),
        onError: (error) => {
          if (error.message.startsWith("409")) {
            showSnackbar("error", t("team.employees.roleChangeLastManagerError", { name }));
          } else {
            showSnackbar("error", t("team.employees.roleChangeError"));
          }
        },
      },
    );
  };

  const handleChangeTeam = (employee: Employee, teamId: string | null) => {
    const name = `${employee.firstName} ${employee.lastName}`;
    teamMutation.mutate(
      { id: employee._id, teamId },
      {
        onSuccess: () => {
          if (teamId === null) {
            showSnackbar("success", t("team.employees.teamUnassignSuccess", { name }));
          } else {
            const teamName = teams.find((team) => team._id === teamId)?.name ?? "";
            showSnackbar("success", t("team.employees.teamAssignSuccess", { name, teamName }));
          }
        },
        onError: () => showSnackbar("error", t("team.employees.teamAssignError")),
      },
    );
  };

  const handleConfirmRemove = () => {
    if (!removeTarget) return;
    const name = `${removeTarget.firstName} ${removeTarget.lastName}`;
    removeMutation.mutate(removeTarget._id, {
      onSuccess: () => {
        showSnackbar("success", t("team.employees.removeSuccess", { name }));
        setRemoveTarget(null);
      },
      onError: (error) => {
        // Both are pre-empted client-side (disabled menu item + tooltip), but the
        // server response is the source of truth if another manager's action raced ours.
        if (error.message.startsWith("409")) {
          showSnackbar("error", t("team.employees.removeLastManagerError"));
        } else if (error.message.startsWith("400")) {
          showSnackbar("error", t("team.employees.selfRemoveTooltip"));
        } else {
          showSnackbar("error", t("team.employees.removeError", { name }));
        }
        setRemoveTarget(null);
      },
    });
  };

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      {
        id: "name",
        header: t("team.employees.columns.name"),
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2" color="textPrimary">
              {row.original.firstName} {row.original.lastName}
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
        Cell: ({ row }) => (
          <Chip
            label={
              row.original.role === "manager"
                ? t("team.employees.roleManager")
                : t("team.employees.roleEmployee")
            }
            size="small"
            variant="outlined"
            sx={{
              borderColor:
                row.original.role === "manager"
                  ? theme.palette.primary.main
                  : theme.palette.border.default,
              color:
                row.original.role === "manager"
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
            }}
          />
        ),
      },
      {
        id: "team",
        header: t("team.employees.columns.team"),
        accessorFn: (row) => resolveTeamName(row, teams) ?? "",
        Cell: ({ row }) => {
          const teamName = resolveTeamName(row.original, teams);
          return teamName ? (
            <Typography variant="body2" color="textSecondary">
              {teamName}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color="textDisabled"
              sx={{ fontStyle: "italic" }}
            >
              {t("team.employees.unassigned")}
            </Typography>
          );
        },
      },
      {
        id: "awsIdentity",
        header: t("team.employees.columns.awsIdentity"),
        accessorFn: (row) => row.hasAwsConnected,
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
    renderRowActions: ({ row }) => (
      <EmployeeRowMenu
        employee={row.original}
        teams={teams}
        isOnlyManager={row.original.role === "manager" && managerCount === 1}
        isSelf={row.original._id === customer?._id}
        isPending={isRowPending(row.original._id)}
        onChangeRole={(role) => handleChangeRole(row.original, role)}
        onChangeTeam={(teamId) => handleChangeTeam(row.original, teamId)}
        onRequestRemove={() => setRemoveTarget(row.original)}
      />
    ),
    displayColumnDefOptions: {
      "mrt-row-actions": { header: "", size: 48 },
    },
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
    muiTableBodyCellProps: {
      sx: { borderColor: theme.palette.border.default },
    },
  });

  const isLoading = employeesLoading || teamsLoading;

  return (
    <>
      <SectionCard>
        <InviteToggleRow
          onClick={() => setShowInvite((prev) => !prev)}
          aria-expanded={showInvite}
          aria-label={
            showInvite
              ? t("team.employees.inviteToggleHide")
              : t("team.employees.inviteToggleShow")
          }
        >
          <PlusIcon size={theme.iconSize.sm} />
          <Typography variant="subtitle1" color="textPrimary" sx={{ flex: 1 }}>
            {showInvite
              ? t("team.employees.inviteToggleHide")
              : t("team.employees.inviteToggleShow")}
          </Typography>
          {showInvite ? (
            <CaretUpIcon size={theme.iconSize.sm} />
          ) : (
            <CaretDownIcon size={theme.iconSize.sm} />
          )}
        </InviteToggleRow>

        {showInvite && <InviteCodeSection />}
      </SectionCard>

      {isLoading && (
        <LoadingBox>
          <CircularProgress />
        </LoadingBox>
      )}

      {!isLoading && employeesError && (
        <ErrorRow>
          <WarningCircleIcon size={theme.iconSize.sm} color={theme.palette.error.main} />
          <Typography variant="body2" color="error">
            {t("team.employees.loadError", { error: employeesQueryError?.message ?? "" })}
          </Typography>
          <Button variant="text" onClick={() => void refetchEmployees()}>
            {t("team.employees.retry")}
          </Button>
        </ErrorRow>
      )}

      {!isLoading && !employeesError && (
        <SectionCard>
          <MaterialReactTable table={table} />

          {employees.length === 1 && (
            <Typography variant="caption" color="textSecondary">
              {t("team.employees.aloneHint")}
            </Typography>
          )}
        </SectionCard>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        title={
          removeTarget
            ? t("team.confirmDialog.removeEmployeeTitle", {
                firstName: removeTarget.firstName,
                lastName: removeTarget.lastName,
              })
            : ""
        }
        body={
          removeTarget
            ? t("team.confirmDialog.removeEmployeeBody", { email: removeTarget.email })
            : ""
        }
        confirmLabel={t("team.confirmDialog.removeEmployeeConfirm")}
        cancelLabel={t("team.confirmDialog.cancel")}
        isPending={removeMutation.isPending}
        onConfirm={handleConfirmRemove}
        onClose={() => setRemoveTarget(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="standard"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmployeesTab;
