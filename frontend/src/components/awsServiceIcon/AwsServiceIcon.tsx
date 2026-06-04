import React from "react";
import { IconWrapper } from "@/components/awsServiceIcon/components/awsServiceIcon.styled";
import { SERVICE_CONFIG } from "@/components/awsServiceIcon/helpers/awsServiceIcon.helpers";
import type { AwsServiceIconProps } from "@/components/awsServiceIcon/types/awsServiceIcon.types";

const AwsServiceIcon: React.FC<AwsServiceIconProps> = ({
  service,
  size = 46,
}) => {
  const Icon = SERVICE_CONFIG[service];

  return (
    <IconWrapper iconSize={size}>
      <Icon size={size} />
    </IconWrapper>
  );
};

export default AwsServiceIcon;
