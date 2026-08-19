/**
 * Normalises any CSS color string to a 6-char hex string (`#rrggbb`).
 *
 * MUI's `darken()` / `lighten()` return `rgb(r, g, b)` regardless of the input
 * format. OGL's `Color` constructor (used by Aurora) only accepts hex, so we
 * need to convert before passing in.
 */
export const toHexColor = (color: string): string => {
  if (color.startsWith("#")) return color;

  // Match the first three integers in an `rgb(...)` or `rgba(...)` string
  const match = color.match(/\d+/g);
  if (!match || match.length < 3) return color;

  const [r, g, b] = match.slice(0, 3).map(Number);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
