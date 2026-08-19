import {
  ErrorActionChip,
  ErrorCause,
  ErrorCauseActions,
  ErrorPopoverContent,
  StatusFooter,
  StatusFooterMessage,
} from "@/components/resourceCard/components/resourceCard.styled";
import { groupBlockedActionsByCause } from "@/components/resourceCard/helpers/resourceCard.helpers";
import type { ResourceCardAction } from "@/components/resourceCard/types/resourceCard.types";
import type { StatusTagVariant } from "@/components/statusTag/types/statusTag.types";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import Popper from "@mui/material/Popper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useHover } from "@uidotdev/usehooks";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface ResourceCardStatusFooterProps {
  status: StatusTagVariant;
  actions: ResourceCardAction[];
}

const ResourceCardStatusFooter: React.FC<ResourceCardStatusFooterProps> = ({
  status,
  actions,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hoverRef, hovering] = useHover<HTMLButtonElement>();
  // Anchored to the alert rather than the button, so both share an edge and a width.
  const [alertEl, setAlertEl] = useState<HTMLDivElement | null>(null);
  const [clickOpen, setClickOpen] = useState(false);

  const blockedActions = actions.filter(({ status: actionStatus }) => actionStatus === "error");
  const [firstBlocked, ...remainingBlocked] = blockedActions;

  // Healthy needs no footer: the tag and the green dots already say it.
  if (status !== "blocked" || !firstBlocked) {
    const summaryKey = {
      stale: "resourceCard.staleSummary",
      unscanned: "resourceCard.unscannedSummary",
    }[status as "stale" | "unscanned"];

    if (!summaryKey) return null;

    return (
      <StatusFooter footerVariant={status}>
        <StatusFooterMessage>{t(summaryKey)}</StatusFooterMessage>

      </StatusFooter>
    );
  }

  const blockedMessage = `${firstBlocked.name} — ${firstBlocked.reason}`;

  return (
    <StatusFooter footerVariant={status} ref={setAlertEl}>
      <Tooltip title={blockedMessage} placement="bottom-start">
        <StatusFooterMessage>{blockedMessage}</StatusFooterMessage>
      </Tooltip>

      {remainingBlocked.length > 0 && (
        <>
          <Button
            ref={hoverRef}
            variant="text"
            color="error"
            size="small"
            // Typography inherited from the row so the button cannot make one
            // footer taller than another.
            sx={{
              flexShrink: 0,
              minWidth: "auto",
              padding: 0,
              fontSize: "inherit",
              lineHeight: "inherit",
            }}
            onClick={() => setClickOpen((isOpen) => !isOpen)}
          >
            {t("resourceCard.moreErrors", { count: remainingBlocked.length })}
          </Button>

          <Popper
            open={hovering || clickOpen}
            anchorEl={alertEl}
            placement="bottom-start"
            transition
            sx={{
              zIndex: (popperTheme) => popperTheme.zIndex.tooltip,
              pointerEvents: clickOpen ? "auto" : "none",
              width: alertEl?.offsetWidth,
            }}
          >
            {({ TransitionProps }) => (
              <Grow {...TransitionProps} timeout={theme.transitions.duration.shorter}>
                <ErrorPopoverContent>
                  <Typography variant="subtitle2" color="textSecondary">
                    {t("resourceCard.allErrors", { count: blockedActions.length })}
                  </Typography>

                  {groupBlockedActionsByCause(blockedActions).map(({ reason, actionNames }) => (
                    <ErrorCause key={reason}>
                      <Typography variant="body2" color="textPrimary">
                        {reason || t("resourceCard.unknownReason")}
                      </Typography>

                      <ErrorCauseActions>
                        {actionNames.map((actionName) => (
                          <ErrorActionChip key={actionName}>{actionName}</ErrorActionChip>
                        ))}

                      </ErrorCauseActions>

                    </ErrorCause>
                  ))}

                </ErrorPopoverContent>
              </Grow>
            )}
          </Popper>

        </>
      )}

    </StatusFooter>
  );
};

export default ResourceCardStatusFooter;
