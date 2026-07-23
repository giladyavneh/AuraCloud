import type { TeamAssignmentOptionProps } from "@/pages/team/types/team.types";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { CheckIcon } from "@phosphor-icons/react";
import React from "react";

/**
 * One row in the assign-team list. The leading slot keeps a fixed width whether or
 * not the check is shown, so every option's label lines up.
 */
const TeamAssignmentOption: React.FC<TeamAssignmentOptionProps> = ({ isSelected, label }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
      <Box sx={{ width: theme.iconSize.xs, display: "flex", flexShrink: 0 }}>
        {isSelected && <CheckIcon size={theme.iconSize.xs} />}
      </Box>

      <Box component="span" sx={{ fontWeight: isSelected ? 600 : 400 }}>
        {label}
      </Box>
    </Box>
  );
};

export default TeamAssignmentOption;
