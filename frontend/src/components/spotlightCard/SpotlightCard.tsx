import { SpotlightCardRoot } from "@/components/spotlightCard/components/spotlightCard.styled";
import { useSpotlight } from "@/components/spotlightCard/hooks/spotlightCard.hooks";
import type { SpotlightCardProps } from "@/components/spotlightCard/types/spotlightCard.types";
import React from "react";

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor,
}) => {
  const { ref, onMouseMove } = useSpotlight<HTMLDivElement>(spotlightColor);

  return (
    <SpotlightCardRoot ref={ref} onMouseMove={onMouseMove} className={className}>
      {children}
    </SpotlightCardRoot>
  );
};

export default SpotlightCard;
