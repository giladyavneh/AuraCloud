import { MONO_LABEL_FONT_SIZE } from "@/constants";
import ResourceCardMoreActions from "@/components/resourceCard/components/ResourceCardMoreActions";
import {
  ResourceDot,
  ResourceItem,
} from "@/components/resourceCard/components/resourceCard.styled";
import type { ResourceCardActionListProps } from "@/components/resourceCard/types/resourceCard.types";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { useTranslation } from "react-i18next";

const ResourceCardActionList: React.FC<ResourceCardActionListProps> = ({
  visibleActions,
  remainingActions,
  dotColor,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (visibleActions.length === 0 && remainingActions.length === 0) {
    return (
      <Typography variant="body2" color="textDisabled">
        {t("resourceCard.noActions")}
      </Typography>
    );
  }

  return (
    <>
      {visibleActions.map((action) => (
        <ResourceItem key={action}>
          <ResourceDot dotColor={dotColor} />

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              fontFamily: theme.typography.fontFamilyMono,
              fontSize: MONO_LABEL_FONT_SIZE,
            }}
          >
            {action}
          </Typography>
        </ResourceItem>
      ))}

      {remainingActions.length > 0 && (
        <ResourceCardMoreActions actions={remainingActions} dotColor={dotColor} />
      )}
    </>
  );
};

export default ResourceCardActionList;
