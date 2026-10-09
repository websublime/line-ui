import type { Meta, StoryObj } from '@storybook/web-components-vite';
import {
  ALIASES,
  GRAY_HUES,
  type GrayHue,
  HUES,
  type Hue,
  ROLES,
  type Role,
  SEMANTIC_MAP,
  type SemanticRole,
  STEPS,
} from '@websublime/line-schemas';
import { html, type TemplateResult } from 'lit';
import { contrastSample, MODES, type Mode, swatch, swatchStyles } from './swatches.js';

// Each role bound to every hue it can take, plus the six roles at the preview
// root. Accent panels set only data-accent, so defaults.css auto-pairs their
// gray role. The aliases resolve inside each panel's own scope.

interface RolesArgs {
  mode: Mode;
}

const SEMANTIC_ROLES = ROLES.filter((role): role is SemanticRole => role in SEMANTIC_MAP);

const roleRow = (role: Role): TemplateResult => html`
  <div class="ds-panel" data-role=${role}>
    <h3 class="ds-label">${role}</h3>
    <div class="ds-grid">${STEPS.map((step) => swatch(`--line-${role}-${step}`))}</div>
    ${contrastSample(`--line-${role}`)}
    <div class="ds-grid">${ALIASES.map((alias) => swatch(`--line-${role}-${alias}`))}</div>
  </div>
`;

const accentPanel = (hue: Hue): TemplateResult => html`
  <section class="ds-panel ds-scope" data-binding="accent" data-accent=${hue}>
    <h2 class="ds-title">accent: ${hue} · gray: auto-paired</h2>
    ${roleRow('accent')} ${roleRow('gray')}
  </section>
`;

const grayPanel = (gray: GrayHue): TemplateResult => html`
  <section class="ds-panel ds-scope" data-binding="gray" data-gray=${gray}>
    <h2 class="ds-title">gray: ${gray}</h2>
    ${roleRow('gray')}
  </section>
`;

const semanticPanel = (role: SemanticRole): TemplateResult => html`
  <section class="ds-panel ds-scope" data-binding="semantic">
    <h2 class="ds-title">${role}: ${SEMANTIC_MAP[role]} (fixed at root)</h2>
    ${roleRow(role)}
  </section>
`;

const page = (mode: Mode, content: TemplateResult): TemplateResult =>
  html`${swatchStyles}<div class="ds-page ds-mode" style="color-scheme: ${mode}">${content}</div>`;

const meta = {
  title: 'Design System/Roles',
  parameters: { layout: 'fullscreen' },
  args: { mode: 'light' },
  argTypes: {
    mode: { control: 'inline-radio', options: MODES },
  },
} satisfies Meta<RolesArgs>;

export default meta;

type Story = StoryObj<RolesArgs>;

export const Bindings: Story = {
  name: 'All bindings',
  render: ({ mode }) =>
    page(
      mode,
      html`
        <h2 class="ds-title">Accent × ${HUES.length} hues</h2>
        ${HUES.map(accentPanel)}
        <h2 class="ds-title">Gray × ${GRAY_HUES.length} hues</h2>
        ${GRAY_HUES.map(grayPanel)}
        <h2 class="ds-title">Semantic roles</h2>
        ${SEMANTIC_ROLES.map(semanticPanel)}
      `,
    ),
};

export const Toolbar: Story = {
  name: 'Toolbar',
  render: ({ mode }) =>
    page(
      mode,
      html`
        <section class="ds-panel ds-scope" data-binding="root">
          <h2 class="ds-title">Roles at the preview root · accent and gray follow the toolbar</h2>
          ${ROLES.map(roleRow)}
        </section>
      `,
    ),
};
