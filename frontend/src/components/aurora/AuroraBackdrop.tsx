import Aurora from "@/components/aurora/Aurora";
import { AuroraLayer, Scrim } from "@/components/aurora/components/aurora.styled";
import { toHexColor } from "@/components/aurora/helpers/aurora.helpers";
import { darken, lighten, useTheme } from "@mui/material/styles";
import React from "react";

// Fills the nearest positioned ancestor; the host card owns its own clipping.
const AuroraBackdrop: React.FC = () => {
  const theme = useTheme();

  // darken/lighten return rgb(); Aurora's WebGL parser only accepts hex.
  const auroraStops = [
    toHexColor(darken(theme.palette.primary.main, 0.35)),
    theme.palette.primary.main,
    toHexColor(lighten(theme.palette.primary.main, 0.2)),
  ];

  return (
    <>
      <AuroraLayer>
        <Aurora colorStops={auroraStops} amplitude={1.0} blend={0.5} speed={0.6} />
      </AuroraLayer>

      <Scrim />

    </>
  );
};

export default AuroraBackdrop;
