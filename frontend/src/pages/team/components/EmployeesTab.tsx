import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog";
import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import FeedbackSnackbar from "@/components/feedbackSnackbar/FeedbackSnackbar";
import { useAuth } from "@/context/auth/AuthContext";
import {
  useEmployees,
  useRemoveEmployee,
  useTeams,
  useUpdateEmployeeRole,
  useUpdateEmployeeTeam,
} from "@/hooks/team.hooks";
import { countManagers, getEmployeeFullName } from "@/pages/team/helpers/team.helpers";
import EmployeeRowMenu from "@/pages/team/components/EmployeeRowMenu";
import EmployeesTable from "@/pages/team/components/EmployeesTable";
import TeamInviteCard from "@/pages/team/components/TeamInviteCard";
import { LoadingBox, SectionCard } from "@/pages/team/components/team.styled";
import type { Employee, SnackbarState } from "@/pages/team/types/team.types";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const EmployeesTab: React.FC = () => {
  const { t } = useTranslation();
  const { customer } = useAuth();

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

  const isLoading = employeesLoading || teamsLoading;
  const managerCount = countManagers(employees);

  const showSnackbar = (severity: "success" | "error", message: string) =>
    setSnackbar({ open: true, severity, message });

  const isRowPending = (employeeId: string) =>
    (roleMutation.isPending && roleMutation.variables?.id === employeeId) ||
    (teamMutation.isPending && teamMutation.variables?.id === employeeId) ||
    (removeMutation.isPending && removeMutation.variables === employeeId);

  const handleChangeRole = (employee: Employee, role: "manager" | "employee") => {
    const name = getEmployeeFullName(employee);

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
    const name = getEmployeeFullName(employee);

    teamMutation.mutate(
      { id: employee._id, teamId },
      {
        onSuccess: () => {
          if (teamId === null) {
            showSnackbar("success", t("team.employees.teamUnassignSuccess", { name }));
            return;
          }

          const teamName = teams.find((team) => team._id === teamId)?.name ?? "";
          showSnackbar("success", t("team.employees.teamAssignSuccess", { name, teamName }));
        },
        onError: () => showSnackbar("error", t("team.employees.teamAssignError")),
      },
    );
  };

  const handleConfirmRemove = () => {
    if (!removeTarget) return;

    const name = getEmployeeFullName(removeTarget);

    removeMutation.mutate(removeTarget._id, {
      onSuccess: () => {
        showSnackbar("success", t("team.employees.removeSuccess", { name }));
        setRemoveTarget(null);
      },
      onError: (error) => {
        // Both are pre-empted client-side, but the server is the source of truth
        // if another manager's action raced this one.
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

  return (
    <>
      <TeamInviteCard />

      {isLoading && (
        <LoadingBox>
          <CircularProgress />
        </LoadingBox>
      )}

      {!isLoading && employeesError && (
        <ErrorRetryRow
          message={t("team.employees.loadError", { error: employeesQueryError?.message ?? "" })}
          retryLabel={t("team.employees.retry")}
          onRetry={() => void refetchEmployees()}
        />
      )}

      {!isLoading && !employeesError && (
        <SectionCard>
          <EmployeesTable
            employees={employees}
            teams={teams}
            renderRowActions={(employee) => (
              <EmployeeRowMenu
                employee={employee}
                teams={teams}
                isOnlyManager={employee.role === "manager" && managerCount === 1}
                isSelf={employee._id === customer?._id}
                isPending={isRowPending(employee._id)}
                onChangeRole={(role) => handleChangeRole(employee, role)}
                onChangeTeam={(teamId) => handleChangeTeam(employee, teamId)}
                onRequestRemove={() => setRemoveTarget(employee)}
              />
            )}
          />

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

      <FeedbackSnackbar
        state={snackbar}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};

export default EmployeesTab;
