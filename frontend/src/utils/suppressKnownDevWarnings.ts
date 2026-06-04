/**
 * Suppresses a small allow-list of known React dev warnings that we can't fix
 * in our own code:
 *
 * 1. `@nxavis/aws-icons` emits SVG attributes in kebab-case (`stroke-width`,
 *    `fill-rule`, `clip-rule`, `stroke-linecap`, `stroke-linejoin`) instead of
 *    the React-required camelCase. The icons still render correctly because
 *    the browser accepts kebab-case SVG attrs — only React's prop validator
 *    complains. Upstream bug; would require patch-package to fix properly.
 *
 * 2. `material-react-table` v3 passes legacy MUI v5 `InputProps` / `inputProps`
 *    to its global-filter TextField. MUI v6's TextField doesn't strip them, so
 *    they leak onto the FormControl root div and React warns.
 *
 * This filter only runs in dev. Production builds get the unmodified
 * `console.error` so any new warnings still surface.
 */

const SUPPRESSED_PATTERNS: RegExp[] = [
  // @nxavis/aws-icons — kebab-case SVG attribute names
  /Invalid DOM property `(stroke-width|fill-rule|clip-rule|stroke-linecap|stroke-linejoin|stroke-miterlimit)`/,
  // material-react-table v3 leaks of legacy MUI v5 input prop keys to the DOM
  /React does not recognize the `(inputProps|InputProps)` prop on a DOM element/,
];

export const installDevWarningSuppressor = (): void => {
  if (!import.meta.env.DEV) return;

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && SUPPRESSED_PATTERNS.some((p) => p.test(first))) {
      return;
    }
    originalError(...args);
  };
};
