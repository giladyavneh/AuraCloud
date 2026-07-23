import React, { useRef } from "react";

/**
 * Wires up the cursor-following spotlight for a card.
 *
 * The pointer position is written straight onto the DOM node as CSS custom
 * properties rather than held in React state, so moving the mouse never
 * triggers a re-render — which matters on the dashboard, where a whole grid of
 * cards is mounted at once.
 */
export const useSpotlight = <T extends HTMLElement>(spotlightColor?: string) => {
  const ref = useRef<T>(null);

  const onMouseMove: React.MouseEventHandler<T> = (event) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    el.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);

    if (spotlightColor) {
      el.style.setProperty("--spotlight-color", spotlightColor);
    }
  };

  return { ref, onMouseMove };
};
