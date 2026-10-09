// Palettes and role maps load globally, so every story and the theming
// toolbar see the --line-* custom properties.
import '@websublime/line-colors';
import '@websublime/line-themes';

import type { Decorator, Preview } from '@storybook/web-components-vite';
import { ACCENT_HUES, GRAY_HUES } from '@websublime/line-schemas';

// Theme toolbar (spec § 6.F.1, PRD §9.5).
//
// Two independent menus set [data-accent] and [data-gray] on <html>. Items come
// from the line-schemas hue lists. The first item of each menu removes its
// attribute, so the PRD §9.5 defaults and gray auto-pairing show.
const DEFAULT_ACCENT = 'default';
const AUTO_GRAY = 'auto';

const toItems = (first: string, hues: readonly string[]) => [first, ...hues].map((value) => ({ value, title: value }));

const setAttribute = (name: string, value: unknown, unset: string): void => {
  const root = document.documentElement;
  if (typeof value === 'string' && value !== unset) root.setAttribute(name, value);
  else root.removeAttribute(name);
};

const withThemeAttributes: Decorator = (story, context) => {
  setAttribute('data-accent', context.globals.accent, DEFAULT_ACCENT);
  setAttribute('data-gray', context.globals.gray, AUTO_GRAY);
  return story();
};

const preview: Preview = {
  globalTypes: {
    accent: {
      description: 'Accent hue ([data-accent])',
      toolbar: {
        title: 'Accent',
        icon: 'paintbrush',
        items: toItems(DEFAULT_ACCENT, ACCENT_HUES),
        dynamicTitle: true,
      },
    },
    gray: {
      description: 'Gray hue ([data-gray])',
      toolbar: {
        title: 'Gray',
        icon: 'contrast',
        items: toItems(AUTO_GRAY, GRAY_HUES),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { accent: DEFAULT_ACCENT, gray: AUTO_GRAY },
  decorators: [withThemeAttributes],
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
