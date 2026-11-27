import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { contrastFor, HUES, type Hue, STEPS } from '@websublime/line-schemas';
import { html, type TemplateResult } from 'lit';
import { contrastSample, MODES, type Mode, swatch, swatchStyles } from './swatches.js';

// This story shows every hue's 12 base steps, 12 alpha steps and contrast token
// in light and dark. Each mode block sets color-scheme, which picks the
// light-dark() branch, and draws the alpha steps over the mode's gray-1 backdrop.
// The contrast sample names the mode's on-color, contrastFor(hue, mode) (AM-092).

const modeBlock = (hue: Hue, mode: Mode): TemplateResult => html`
  <div class="ds-mode" data-mode=${mode} style="color-scheme: ${mode}">
    <p class="ds-label">${mode}</p>
    <div class="ds-grid">${STEPS.map((step) => swatch(`--line-${hue}-${step}`))}</div>
    <div class="ds-grid">${STEPS.map((step) => swatch(`--line-${hue}-a${step}`))}</div>
    ${contrastSample(`--line-${hue}`, ` (${contrastFor(hue, mode)})`)}
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
