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
import ResourceCardArn from "@/components/resourceCard/components/ResourceCardArn";
import ResourceCardStatusFooter from "@/components/resourceCard/components/ResourceCardStatusFooter";
import {
  countBlockedActions,
  getResourceDotColor,
  MAX_VISIBLE_ACTIONS,
} from "@/components/resourceCard/helpers/resourceCard.helpers";
import type { ResourceCardProps } from "@/components/resourceCard/types/resourceCard.types";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import StatusTag from "@/components/statusTag/StatusTag";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React from "react";
import { useTranslation } from "react-i18next";

const ResourceCard: React.FC<ResourceCardProps> = ({
  service,
  title,
  arn,
  lastUpdated,
  status,
  actions,
  maxVisibleActions = MAX_VISIBLE_ACTIONS,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const visibleActions = actions.slice(0, maxVisibleActions);
  const remainingActions = actions.slice(maxVisibleActions);
  const dotColor = getResourceDotColor(theme.palette, status);

  const tagLabel =
    status === "blocked"
      ? t("status.blockedCount", {
          blocked: countBlockedActions(actions),
          total: actions.length,
        })
      : undefined;

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

              <StatusTag variant={status} label={tagLabel} />
            </MetaTopRow>

            <Typography
              variant="h5"
              color="textPrimary"
              sx={{ wordBreak: "break-word", textWrapStyle: "balance" }}
            >
              {title}
            </Typography>

            <ResourceCardArn arn={arn} />

          </ServiceMeta>
        </CardHeader>

        <ResourceList>
          <Typography variant="subtitle1" color="textSecondary">
            {t("resourceCard.actions")}
          </Typography>

          <ResourceCardActionList
            visibleActions={visibleActions}
            remainingActions={remainingActions}
            resourceStatus={status}
          />
        </ResourceList>

        <ResourceCardStatusFooter status={status} actions={actions} />
      </CardBody>
    </CardRoot>
  );
};

export default ResourceCard;
