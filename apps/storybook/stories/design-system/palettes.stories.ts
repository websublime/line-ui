import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { HUES, type Hue, PER_HUE_CONTRAST, STEPS } from '@websublime/line-schemas';
import { html, type TemplateResult } from 'lit';
import { contrastSample, MODES, type Mode, swatch, swatchStyles } from './swatches.js';

// This story shows every hue's 12 base steps, 12 alpha steps and contrast token
// in light and dark. Each mode block sets color-scheme, which picks the
// light-dark() branch, and draws the alpha steps over the mode's gray-1 backdrop.

const modeBlock = (hue: Hue, mode: Mode): TemplateResult => html`
  <div class="ds-mode" data-mode=${mode} style="color-scheme: ${mode}">
    <p class="ds-label">${mode}</p>
    <div class="ds-grid">${STEPS.map((step) => swatch(`--line-${hue}-${step}`))}</div>
    <div class="ds-grid">${STEPS.map((step) => swatch(`--line-${hue}-a${step}`))}</div>
    ${contrastSample(`--line-${hue}`, ` (${PER_HUE_CONTRAST[hue]})`)}
  </div>
`;

const huePanel = (hue: Hue): TemplateResult => html`
  <section class="ds-panel" data-hue=${hue}>
    <h2 class="ds-title">${hue}</h2>
    <div class="ds-modes">${MODES.map((mode) => modeBlock(hue, mode))}</div>
  </section>
`;

const meta = {
  title: 'Design System/Palettes',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const AllHues: Story = {
  name: 'All hues',
  render: () => html`${swatchStyles}<div class="ds-page">${HUES.map(huePanel)}</div>`,
};
