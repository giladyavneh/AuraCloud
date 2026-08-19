import {
  ErrorDivider,
  MoreActionsPopoverContent,
  StatusFooter,
  StatusFooterMessage,
} from "@/components/resourceCard/components/resourceCard.styled";
import type { ResourceCardAction } from "@/components/resourceCard/types/resourceCard.types";
import type { StatusTagVariant } from "@/components/statusTag/types/statusTag.types";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useHover } from "@uidotdev/usehooks";
import React, { useCallback, useState } from "react";
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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [clickOpen, setClickOpen] = useState(false);

  // Popper needs a stable non-null element, which ref.current is not at render time.
  const setRefs = useCallback(
    (element: HTMLButtonElement | null) => {
      hoverRef(element);
      setAnchorEl(element);
    },
    [hoverRef],
  );

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
    <StatusFooter footerVariant={status}>
      <Tooltip title={blockedMessage} placement="bottom-start">
        <StatusFooterMessage>{blockedMessage}</StatusFooterMessage>
      </Tooltip>

      {remainingBlocked.length > 0 && (
        <>
          <Button
            ref={setRefs}
            variant="text"
            color="error"
            size="small"
            sx={{ flexShrink: 0, minWidth: "auto" }}
            onClick={() => setClickOpen((isOpen) => !isOpen)}
          >
            {t("resourceCard.moreErrors", { count: remainingBlocked.length })}
          </Button>

          <Popper
            open={hovering || clickOpen}
            anchorEl={anchorEl}
            placement="bottom-end"
            transition
            sx={{
              zIndex: (popperTheme) => popperTheme.zIndex.tooltip,
              pointerEvents: clickOpen ? "auto" : "none",
            }}
          >
            {({ TransitionProps }) => (
              <Grow {...TransitionProps} timeout={theme.transitions.duration.shorter}>
                <Paper elevation={4}>
                  <MoreActionsPopoverContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t("resourceCard.allErrors")}
                    </Typography>

                    <Stack divider={<ErrorDivider flexItem />} spacing={2}>
                      {remainingBlocked.map(({ name, reason }) => (
                        <Typography key={name} variant="body2" color="textSecondary">
                          {name} — {reason}
                        </Typography>
                      ))}

                    </Stack>

                  </MoreActionsPopoverContent>
                </Paper>
              </Grow>
            )}
          </Popper>

        </>
      )}

    </StatusFooter>
  );
};

export default ResourceCardStatusFooter;
