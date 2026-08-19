import {
  ErrorDivider,
  MoreActionsPopoverContent,
} from "@/components/resourceCard/components/resourceCard.styled";
import type { ResourceCardAction } from "@/components/resourceCard/types/resourceCard.types";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useHover } from "@uidotdev/usehooks";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

interface ResourceCardErrorAlertProps {
  blockedActions: ResourceCardAction[];
}

const ResourceCardErrorAlert: React.FC<ResourceCardErrorAlertProps> = ({ blockedActions }) => {
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

  const [firstBlocked, ...remainingBlocked] = blockedActions;
  if (!firstBlocked) return null;

  return (
    <Alert severity="error">
      <Typography variant="body2">
        {firstBlocked.name} — {firstBlocked.reason}
      </Typography>

      {remainingBlocked.length > 0 && (
        <>
          <Button
            ref={setRefs}
            variant="text"
            color="error"
            size="small"
            sx={{ width: "fit-content", marginTop: 1 }}
            onClick={() => setClickOpen((isOpen) => !isOpen)}
          >
            {t("resourceCard.moreErrors", { count: remainingBlocked.length })}
          </Button>

          <Popper
            open={hovering || clickOpen}
            anchorEl={anchorEl}
            placement="bottom-start"
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
    </Alert>
  );
};

export default ResourceCardErrorAlert;
