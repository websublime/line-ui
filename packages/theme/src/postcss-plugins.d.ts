/**
 * Type declarations for PostCSS plugins that lack built-in types.
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

declare module 'postcss-simple-vars' {
  import type { PluginCreator } from 'postcss';
  const plugin: PluginCreator<Record<string, unknown>>;
  export default plugin;
}

declare module 'postcss-nested' {
  import type { PluginCreator } from 'postcss';
  const plugin: PluginCreator<Record<string, unknown>>;
  export default plugin;
}

declare module 'postcss-preset-env' {
  import type { PluginCreator } from 'postcss';
  const plugin: PluginCreator<Record<string, unknown>>;
  export default plugin;
}

declare module 'postcss-custom-media' {
  import type { PluginCreator } from 'postcss';
  const plugin: PluginCreator<Record<string, unknown>>;
  export default plugin;
}

declare module 'cssnano' {
  import type { PluginCreator } from 'postcss';
  const plugin: PluginCreator<Record<string, unknown>>;
  export default plugin;
}
