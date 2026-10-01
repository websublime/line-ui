/**
 * Vite `?inline` CSS module typing for the reset sheets (spec §6.D.7).
 *
 * Declared here rather than via `"types": ["vite/client"]` because
 * `line-core`'s `tsconfig.json` must match the spec §7.1 matrix exactly.
 */
declare module '*.css?inline' {
  const css: string;
  export default css;
}
