import { SPOTLIGHT_TINT_ALPHA } from "@/constants";
import AwsServiceIcon from "@/components/awsServiceIcon/AwsServiceIcon";
import {
  CardBody,
  CardHeader,
  CardRoot,
  MetaTopRow,
  ResourceList,
  ServiceMeta,
} from "@/components/resourceCard/components/resourceCard.styled";
import ResourceCardActionList from "@/components/resourceCard/components/ResourceCardActionList";
import {
  getResourceDotColor,
  MAX_VISIBLE_ACTIONS,
} from "@/components/resourceCard/helpers/resourceCard.helpers";
import type { ResourceCardProps } from "@/components/resourceCard/types/resourceCard.types";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import StatusTag from "@/components/statusTag/StatusTag";
import { Alert } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTranslation } from "react-i18next";

const ResourceCard: React.FC<ResourceCardProps> = ({
  service,
  title,
  lastUpdated,
  status,
  actions,
  errorMessage,
  maxVisibleActions = MAX_VISIBLE_ACTIONS,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const visibleActions = actions.slice(0, maxVisibleActions);
  const remainingActions = actions.slice(maxVisibleActions);
  const dotColor = getResourceDotColor(theme.palette, status);

  // Tint the spotlight with the card's own status colour, so hovering a blocked
  // resource glows red and a healthy one green.
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>(
    alpha(dotColor, SPOTLIGHT_TINT_ALPHA),
  );

  return (
    <CardRoot ref={ref} onMouseMove={onMouseMove}>
      <CardBody>
        <CardHeader>
          <AwsServiceIcon service={service} size={theme.iconSize.xl} />

          <ServiceMeta>
            <MetaTopRow>
              <Typography variant="caption" color="textDisabled">
                {lastUpdated}
              </Typography>

              <StatusTag variant={status} />
            </MetaTopRow>

            <Typography
              variant="h5"
              color="textPrimary"
              sx={{ wordBreak: "break-word", textWrapStyle: "balance" }}
            >
              {title}
            </Typography>
          </ServiceMeta>
        </CardHeader>

        <ResourceList>
          <Typography variant="subtitle1" color="textSecondary">
            {t("resourceCard.actions")}
          </Typography>

          <ResourceCardActionList
            visibleActions={visibleActions}
            remainingActions={remainingActions}
            dotColor={dotColor}
          />
        </ResourceList>

        {errorMessage && (
          <Alert severity="error">
            <Typography variant="body2">
              {t("resourceCard.errorPrefix")} {errorMessage}
            </Typography>
          </Alert>
        )}
      </CardBody>
    </CardRoot>
  );
};

export default ResourceCard;
