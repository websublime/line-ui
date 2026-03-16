/**
 * Ambient type declarations for PostCSS plugins that lack built-in types.
 *
 * Only plugins without shipped .d.ts files need declarations here.
 * Plugins with shipped types (postcss-preset-env, cssnano, postcss-nested,
 * postcss-simple-vars, postcss-custom-media) are intentionally omitted so
 * TypeScript resolves their real, narrowly-typed definitions.
 */
declare module 'postcss-import' {
  import type { PluginCreator } from 'postcss';
  const plugin: PluginCreator<Record<string, unknown>>;
  export default plugin;
}

declare module 'postcss-mixins' {
  import type { PluginCreator } from 'postcss';
  const plugin: PluginCreator<Record<string, unknown>>;
  export default plugin;
}
