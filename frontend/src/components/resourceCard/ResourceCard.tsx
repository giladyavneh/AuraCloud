import AwsServiceIcon from "@/components/awsServiceIcon/AwsServiceIcon";
import {
  CardBody,
  CardHeader,
  CardRoot,
  ResourceDot,
  ResourceItem,
  ResourceList,
  ServiceInfo,
  ServiceMeta,
} from "@/components/resourceCard/components/resourceCard.styled";
import {
  getResourceDotColor,
  MAX_VISIBLE_ACTIONS,
} from "@/components/resourceCard/helpers/resourceCard.helpers";
import type { ResourceCardProps } from "@/components/resourceCard/types/resourceCard.types";
import StatusTag from "@/components/statusTag/StatusTag";
import { Alert, Button } from "@mui/material";
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
  const remainingCount = actions.length - maxVisibleActions;
  const dotColor = getResourceDotColor(theme.palette, status);

  return (
    <CardRoot>
      <CardBody>
        <CardHeader>
          <ServiceInfo>
            <AwsServiceIcon service={service} size={46} />
            <ServiceMeta>
              <Typography variant="caption" color="textDisabled">
                {lastUpdated}
              </Typography>
              <Typography variant="h5" color="textPrimary">
                {title}
              </Typography>
            </ServiceMeta>
          </ServiceInfo>
          <StatusTag variant={status} />
        </CardHeader>

        <ResourceList>
          <Typography variant="subtitle1" color="textSecondary">
            {t("resourceCard.actions")}
          </Typography>

          {visibleActions.map((action) => (
            <ResourceItem key={action}>
              <ResourceDot dotColor={dotColor} />
              <Typography variant="body2" color="textSecondary">
                {action}
              </Typography>
            </ResourceItem>
          ))}

          {remainingCount > 0 && (
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}
            >
              {t("resourceCard.moreActions", { count: remainingCount })}
            </Typography>
          )}
        </ResourceList>

        {errorMessage && (
          <Alert
            severity="error"
            action={
              <Button size="small" variant="text" color="inherit">
                {/* TODO: add functionality */}
                {t("resourceCard.details")}
              </Button>
            }
          >
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
