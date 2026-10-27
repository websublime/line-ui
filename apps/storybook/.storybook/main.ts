import type { StorybookConfig } from '@storybook/web-components-vite';
import remarkGfm from 'remark-gfm';

// Storybook 10 + @storybook/web-components-vite builder (spec § 6.F.1).
//
// @storybook/addon-docs compiles the MDX guides and renders autodocs pages.
// @storybook/addon-essentials is absent because it stopped at Storybook 8 and
// no ^10.x is published.
const config: StorybookConfig = {
  framework: { name: '@storybook/web-components-vite', options: {} },
  stories: ['../stories/**/*.@(mdx|stories.@(ts|js))'],
  addons: [
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-docs',
      // MDX 3 parses CommonMark only; remark-gfm adds GFM tables (AM-056).
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
  ],
  staticDirs: ['../public'],
  // Stories tagged 'autodocs' get a docs page by default, so no docs config
  // entry is needed.
  viteFinal: async (cfg) => {
    // The Custom Elements Manifest is not loaded here: preview.ts passes the
    // line-components package manifest to setCustomElementsManifest.
    //
    // The design-system CSS arrives already built for the project's browser
    // targets. cssTarget 'esnext' stops the build minifier from lowering it
    // again, which would rewrite light-dark() into a fallback that needs a
    // compiled color-scheme rule to resolve.
    //
    // chunkSizeWarningLimit is in kB. The chunks above Vite's 500 kB default are
    // Storybook's own runtime. They are iframe, the addon-docs doc blocks and axe-core
    // from addon-a11y (AM-065).
    return { ...cfg, build: { ...cfg.build, cssTarget: 'esnext', chunkSizeWarningLimit: 1000 } };
  },
};

export default config;
