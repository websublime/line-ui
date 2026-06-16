import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/web-components-vite';
import { ACCENT_HUES, GRAY_HUES } from '@websublime/line-schemas';

// Global theming decorators (spec § 6.F.1, PRD §9.5).
//
// Two independent toolbar switchers toggle [data-accent] and [data-gray] on the
// preview root, so authors can verify any of the 31 accents × 6 grays without
// writing per-combination stories. Theme names map 1:1 to attribute values.
const toThemeMap = (hues: readonly string[]): Record<string, string> =>
  Object.fromEntries(hues.map((hue) => [hue, hue]));

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      attributeName: 'data-accent',
      themes: toThemeMap(ACCENT_HUES),
      defaultTheme: 'iris',
    }),
    withThemeByDataAttribute({
      attributeName: 'data-gray',
      themes: toThemeMap(GRAY_HUES),
      defaultTheme: 'gray',
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
