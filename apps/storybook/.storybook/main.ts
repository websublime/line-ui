import type { StorybookConfig } from '@storybook/web-components-vite';

// Storybook 10 + @storybook/web-components-vite builder (spec § 6.F.1).
//
// @storybook/addon-docs compiles the MDX guides and renders autodocs pages.
// @storybook/addon-essentials is absent because it stopped at Storybook 8 and
// no ^10.x is published.
const config: StorybookConfig = {
  framework: { name: '@storybook/web-components-vite', options: {} },
  stories: ['../stories/**/*.@(mdx|stories.@(ts|js))'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  staticDirs: ['../public'],
  // Stories tagged 'autodocs' get a docs page by default, so no docs config
  // entry is needed.
  viteFinal: async (cfg) => {
    // CEM consumed automatically when customElements.json is present at the project root.
    //
    // The design-system CSS arrives already built for the project's browser
    // targets. cssTarget 'esnext' stops the build minifier from lowering it
    // again, which would rewrite light-dark() into a fallback that needs a
    // compiled color-scheme rule to resolve.
    return { ...cfg, build: { ...cfg.build, cssTarget: 'esnext' } };
  },
};

export default config;
