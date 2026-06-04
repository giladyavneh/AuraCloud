import { SpotlightCardRoot } from "@/components/spotlightCard/components/spotlightCard.styled";
import type { SpotlightCardProps } from "@/components/spotlightCard/types/spotlightCard.types";
import React, { useRef } from "react";

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty("--mouse-x", `${x}px`);
    el.style.setProperty("--mouse-y", `${y}px`);
    if (spotlightColor) {
      el.style.setProperty("--spotlight-color", spotlightColor);
    }
  };

  return (
    <SpotlightCardRoot ref={ref} onMouseMove={handleMouseMove} className={className}>
      {children}
    </SpotlightCardRoot>
  );
};

export default SpotlightCard;
