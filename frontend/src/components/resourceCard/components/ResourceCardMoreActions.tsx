import {
  MoreActionsPopoverContent,
  ResourceDot,
  ResourceItem,
} from "@/components/resourceCard/components/resourceCard.styled";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useHover } from "@uidotdev/usehooks";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

interface ResourceCardMoreActionsProps {
  actions: string[];
  dotColor: string;
}

const ResourceCardMoreActions: React.FC<ResourceCardMoreActionsProps> = ({
  actions,
  dotColor,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hoverRef, hovering] = useHover<HTMLButtonElement>();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [clickOpen, setClickOpen] = useState(false);

  // Combine useHover's ref with a state setter so Popper always gets
  // a stable, non-null element reference rather than ref.current at render time
  const setRefs = useCallback(
    (el: HTMLButtonElement | null) => {
      hoverRef(el);
      setAnchorEl(el);
    },
    [hoverRef],
  );

  return (
    <>
      <Button
        ref={setRefs}
        variant="text"
        color="primary"
        size="small"
        sx={{ width: "fit-content", marginTop: 1 }}
        onClick={() => setClickOpen((prev) => !prev)}
      >
        {t("resourceCard.moreActions", { count: actions.length })}
      </Button>

      <Popper
        open={hovering || clickOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        transition
        sx={{ zIndex: (theme) => theme.zIndex.tooltip, pointerEvents: clickOpen ? "auto" : "none" }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={theme.transitions.duration.shorter}>
            <Paper elevation={4}>
              <MoreActionsPopoverContent>
                <Typography variant="subtitle2" color="textSecondary">
                  {t("resourceCard.allActions")}
                </Typography>

                {actions.map((action) => (
                  <ResourceItem key={action}>
                    <ResourceDot dotColor={dotColor} />
                    <Typography variant="body2" color="textSecondary">
                      {action}
                    </Typography>
                  </ResourceItem>
                ))}

              </MoreActionsPopoverContent>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default ResourceCardMoreActions;
