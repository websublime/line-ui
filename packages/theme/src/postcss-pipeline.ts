/**
 * Shared PostCSS plugin pipeline — single source of truth.
 *
 * Both `build.ts` (production build) and `postcss.config.mjs` (Vite dev server)
 * import from this module so the plugin chain is defined exactly once.
 *
 * The factory uses dynamic imports to preserve lazy-loading: plugins are only
 * loaded when `createPlugins()` is called, not at module evaluation time.
 *
 * @module postcss-pipeline
 */

import type { AcceptedPlugin } from 'postcss';

/**
 * Lazily load and configure the full PostCSS plugin chain.
 *
 * @returns Array of PostCSS plugins, ready to pass to `postcss()` or a config object.
 */
export async function createPlugins(): Promise<AcceptedPlugin[]> {
  const [
    { default: postcssImport },
    { default: postcssMixins },
    { default: postcssSimpleVars },
    { default: postcssNested },
    { default: postcssPresetEnv },
    { default: customMedia },
    { default: cssNano }
  ] = await Promise.all([
    import('postcss-import'),
    import('postcss-mixins'),
    import('postcss-simple-vars'),
    import('postcss-nested'),
    import('postcss-preset-env'),
    import('postcss-custom-media'),
    import('cssnano')
  ]);

  return [
    postcssImport(),
    postcssMixins(),
    postcssSimpleVars(),
    postcssNested(),
    postcssPresetEnv({
      // The shipped types for postcss-preset-env@9 only accept autoprefixer.Options,
      // but the runtime also accepts `false` to disable autoprefixer entirely.
      // Use a targeted assertion instead of casting the whole call to `any`.
      autoprefixer: false as never,
      features: {
        'color-functional-notation': false,
        'custom-media-queries': { preserve: true },
        'custom-properties': false,
        'double-position-gradients': false,
        'focus-visible-pseudo-class': false,
        'focus-within-pseudo-class': false,
        'gap-properties': false,
        'logical-properties-and-values': false,
        'not-pseudo-class': false,
        'place-properties': false,
        'prefers-color-scheme-query': false
      },
      stage: 0
    }),
    customMedia(),
    cssNano({
      preset: 'default'
    })
  ];
}
