/** Vite `?inline` CSS module typing for the surface's shadow stylesheet; `bun test` serves it through the preload. */
declare module '*.css?inline' {
  const css: string;
  export default css;
}
