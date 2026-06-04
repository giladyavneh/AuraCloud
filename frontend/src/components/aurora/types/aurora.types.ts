export interface AuroraProps {
  /** Array of 3 hex colors used as gradient stops along the X axis. */
  colorStops?: string[];
  /** Wave amplitude (0–1+). Higher = taller ribbons. */
  amplitude?: number;
  /** Edge softness between the aurora and transparency (0–1). */
  blend?: number;
  /** Manual time override (uses RAF clock when omitted). */
  time?: number;
  /** Animation speed multiplier. */
  speed?: number;
}
