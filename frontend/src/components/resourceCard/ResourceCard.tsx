import { MONO_LABEL_FONT_SIZE } from "@/constants";
import AwsServiceIcon from "@/components/awsServiceIcon/AwsServiceIcon";
import {
  CardBody,
  CardHeader,
  CardRoot,
  MetaTopRow,
  ResourceDot,
  ResourceItem,
  ResourceList,
  ServiceMeta,
} from "@/components/resourceCard/components/resourceCard.styled";
import ResourceCardMoreActions from "@/components/resourceCard/components/ResourceCardMoreActions";
import {
  getResourceDotColor,
  MAX_VISIBLE_ACTIONS,
} from "@/components/resourceCard/helpers/resourceCard.helpers";
import type { ResourceCardProps } from "@/components/resourceCard/types/resourceCard.types";
import StatusTag from "@/components/statusTag/StatusTag";
import { Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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

  return (
    <CardRoot>
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

            <Typography variant="h5" color="textPrimary">
              {title}
            </Typography>
          </ServiceMeta>
        </CardHeader>

        <ResourceList>
          <Typography variant="subtitle1" color="textSecondary">
            {t("resourceCard.actions")}
          </Typography>

          {visibleActions.map((action) => (
            <ResourceItem key={action}>
              <ResourceDot dotColor={dotColor} />

              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontFamily: theme.typography.fontFamilyMono, fontSize: MONO_LABEL_FONT_SIZE }}
              >
                {action}
              </Typography>
            </ResourceItem>
          ))}

          {remainingActions.length > 0 && (
            <ResourceCardMoreActions
              actions={remainingActions}
              dotColor={dotColor}
            />
          )}
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
