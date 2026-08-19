import {
  ArnHead,
  ArnTail,
  ResourceArnRow,
} from "@/components/resourceCard/components/resourceCard.styled";
import { splitArnForDisplay } from "@/helpers/arn.helpers";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

interface ResourceCardArnProps {
  arn: string;
}

const ResourceCardArn: React.FC<ResourceCardArnProps> = ({ arn }) => {
  const { head, tail } = splitArnForDisplay(arn);

  return (
    <Tooltip title={arn} placement="bottom-start">
      <ResourceArnRow>
        <ArnHead>{head}</ArnHead>
        <ArnTail>{tail}</ArnTail>

      </ResourceArnRow>
    </Tooltip>
  );
};

export default ResourceCardArn;
