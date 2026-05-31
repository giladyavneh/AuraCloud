import type { CSSProperties } from "react";

export type PixelBlastVariant = "square" | "circle" | "triangle" | "diamond";

export interface TouchPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  force: number;
  age: number;
}

export interface ReinitConfig {
  antialias: boolean;
  liquid: boolean;
  noiseAmount: number;
  // Changing the click target requires re-attaching the pointerdown listener,
  // which only happens inside the WebGL init path.
  rippleTrigger: "canvas" | "window";
}

export interface PixelBlastProps {
  variant?: PixelBlastVariant;
  pixelSize?: number;
  /** CSS color string for the pixel fill. */
  color?: string;
  className?: string;
  style?: CSSProperties;
  antialias?: boolean;
  patternScale?: number;
  patternDensity?: number;
  liquid?: boolean;
  liquidStrength?: number;
  liquidRadius?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleIntensityScale?: number;
  rippleThickness?: number;
  rippleSpeed?: number;
  liquidWobbleSpeed?: number;
  autoPauseOffscreen?: boolean;
  speed?: number;
  transparent?: boolean;
  edgeFade?: number;
  noiseAmount?: number;
  /**
   * Where to listen for ripple-triggering clicks.
   * - 'canvas' (default): only clicks directly on the canvas trigger ripples
   * - 'window': any click on the page triggers a ripple (useful when the canvas
   *   sits behind other interactive elements like a card)
   */
  rippleTrigger?: "canvas" | "window";
}
