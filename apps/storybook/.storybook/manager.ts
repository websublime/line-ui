import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Manager UI branding (spec § 6.F.1 — Phase 00: minimal).
//
// A light theme carrying the line://ui brand title only. Logos, palette tokens
// and richer chrome land in a later phase alongside the branding assets.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'line://ui',
    brandUrl: 'https://github.com/websublime/line-ui',
  }),
});
