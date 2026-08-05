import ConfirmDialog from "@/components/confirmDialog/ConfirmDialog";
import EmptyState from "@/components/emptyState/EmptyState";
import ErrorRetryRow from "@/components/errorRetryRow/ErrorRetryRow";
import FeedbackSnackbar from "@/components/feedbackSnackbar/FeedbackSnackbar";
import { useAuth } from "@/context/auth/AuthContext";
import { formatTimestamp } from "@/helpers/time.helpers";
import { useCompanyOAuthGrants, useRevokeOAuthGrant } from "@/hooks/oauth.hooks";
import AiAccessTable from "@/pages/team/components/AiAccessTable";
import { LoadingBox, SectionCard, SummaryLine } from "@/pages/team/components/team.styled";
import {
  countExternalConnections,
  getConnectionOwnerName,
  resolveConnectionOrigin,
} from "@/pages/team/helpers/team.helpers";
import type { CompanyConnectedClient, SnackbarState } from "@/pages/team/types/team.types";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { PlugsConnectedIcon } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const EMPTY_STATE_ICON_SIZE = 48;

const AiAccessTab: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { customer } = useAuth();

  const {
    data: grants = [],
    isLoading,
    isFetching,
    isError,
    error: grantsQueryError,
    refetch: refetchGrants,
  } = useCompanyOAuthGrants();
  const revokeMutation = useRevokeOAuthGrant();

  const [disconnectTarget, setDisconnectTarget] = useState<CompanyConnectedClient | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: "success",
    message: "",
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const emptyStateCtaRef = useRef<HTMLButtonElement>(null);
  const [shouldRefocusAfterDisconnect, setShouldRefocusAfterDisconnect] = useState(false);

  // The row that had focus unmounts with its button, and on close MUI restores focus to
  // it — so nothing can take focus until the dialog is gone and the refetch has settled.
  // Cutting the last connection takes the whole table with it, search box included, which
  // is why the target is decided here rather than at the moment of the click.
  useEffect(() => {
    if (!shouldRefocusAfterDisconnect || disconnectTarget !== null || isFetching) return;

    const refocusTarget = grants.length > 0 ? searchInputRef.current : emptyStateCtaRef.current;
    refocusTarget?.focus();
    setShouldRefocusAfterDisconnect(false);
  }, [shouldRefocusAfterDisconnect, disconnectTarget, isFetching, grants.length]);

  const externalCount = countExternalConnections(grants);

  const originOf = (grant: CompanyConnectedClient) =>
    resolveConnectionOrigin(grant, t("team.aiAccess.unknownAddress"));

  const isRowPending = (grantId: string) =>
    revokeMutation.isPending && revokeMutation.variables === grantId;

  const handleConfirmDisconnect = () => {
    if (!disconnectTarget) return;

    const name = getConnectionOwnerName(disconnectTarget);
    const origin = originOf(disconnectTarget);

    revokeMutation.mutate(disconnectTarget.id, {
      onSuccess: () => {
        setSnackbar({
          open: true,
          severity: "success",
          message: t("team.aiAccess.disconnectSuccess", { name, origin }),
        });
        setShouldRefocusAfterDisconnect(true);
      },
      // The row stays: the client is still connected, and retry is the same button.
      onError: () =>
        setSnackbar({
          open: true,
          severity: "error",
          message: t("team.aiAccess.disconnectError", { name, origin }),
        }),
      onSettled: () => setDisconnectTarget(null),
    });
  };

  const hasGrants = !isLoading && !isError && grants.length > 0;

  return (
    <>
      {hasGrants && (
        <SummaryLine>
          <Typography variant="body2" color="textSecondary">
            {t("team.aiAccess.summary", { count: grants.length })}
          </Typography>

          {externalCount > 0 && (
            <Typography variant="body2" color="textSecondary">
              {t("team.aiAccess.summaryExternal", { count: externalCount })}
            </Typography>
          )}

        </SummaryLine>
      )}

      {isLoading && (
        <LoadingBox>
          <CircularProgress />
        </LoadingBox>
      )}

      {!isLoading && isError && (
        <ErrorRetryRow
          message={t("team.aiAccess.loadError", { error: grantsQueryError?.message ?? "" })}
          retryLabel={t("team.aiAccess.retry")}
          onRetry={() => void refetchGrants()}
        />
      )}

      {!isLoading && !isError && grants.length === 0 && (
        <EmptyState
          icon={
            <PlugsConnectedIcon
              size={EMPTY_STATE_ICON_SIZE}
              color={theme.palette.text.disabled}
            />
          }
          title={t("team.aiAccess.emptyTitle")}
          description={t("team.aiAccess.emptyDescription")}
          ctaLabel={t("team.aiAccess.emptyCta")}
          ctaRef={emptyStateCtaRef}
          onCta={() => navigate("/settings")}
        />
      )}

      {hasGrants && (
        <SectionCard>
          <AiAccessTable
            grants={grants}
            currentCustomerId={customer?._id}
            searchInputRef={searchInputRef}
            onDisconnect={setDisconnectTarget}
            isRowPending={isRowPending}
          />

          {/* Said once — twenty copies is a warning nobody reads by row three. */}
          <Typography variant="caption" color="textSecondary">
            {t("team.aiAccess.nameCaveat")}
          </Typography>

        </SectionCard>
      )}

      <ConfirmDialog
        open={disconnectTarget !== null}
        title={
          disconnectTarget
            ? t("team.confirmDialog.disconnectAiTitle", {
                firstName: disconnectTarget.employee.firstName,
              })
            : ""
        }
        body={
          disconnectTarget
            ? t("team.confirmDialog.disconnectAiBody", {
                firstName: disconnectTarget.employee.firstName,
                origin: originOf(disconnectTarget),
                connected: formatTimestamp(disconnectTarget.connectedAt),
              })
            : ""
        }
        confirmLabel={t("team.confirmDialog.disconnectAiConfirm")}
        cancelLabel={t("team.confirmDialog.cancel")}
        isPending={revokeMutation.isPending}
        onConfirm={handleConfirmDisconnect}
        onClose={() => setDisconnectTarget(null)}
      />

      <FeedbackSnackbar
        state={snackbar}
        onClose={() => setSnackbar((previous) => ({ ...previous, open: false }))}
      />

    </>
  );
};

export default AiAccessTab;
