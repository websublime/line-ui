import type { Meta, StoryObj } from '@storybook/web-components-vite';
import {
  ACCENT_HUES,
  type AccentHue,
  ALIASES,
  GRAY_HUES,
  type GrayHue,
  HUES,
  ROLES,
  SEMANTIC_MAP,
  type SemanticRole,
  STEPS,
} from '@websublime/line-schemas';
import { html, nothing, type TemplateResult } from 'lit';
import { contrastSample, swatch, swatchStyles } from './design-system/swatches.js';

// Demo stories for the Theming guide (theming.mdx). The '!dev' tag keeps them
// out of the sidebar, and the guide embeds them with <Canvas of>.

const AUTO_GRAY = 'auto';
const SCHEMES = ['light', 'dark', 'light dark'] as const;
const SEMANTIC_ROLES = ROLES.filter((role): role is SemanticRole => role in SEMANTIC_MAP);

type Scheme = (typeof SCHEMES)[number];

interface AutoPairArgs {
  accent: AccentHue;
  gray: typeof AUTO_GRAY | GrayHue;
}

interface LightDarkArgs {
  scheme: Scheme;
}

const themingStyles = html`<style>
  .th-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .th-table th {
    padding: 2px 4px;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
  }
  .th-table th[scope='row'] {
    width: 88px;
  }
  .th-table td {
    padding: 2px;
  }
  .th-chip {
    height: 24px;
    border-radius: 4px;
  }
  .th-samples {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
  }
</style>`;

const page = (content: TemplateResult): TemplateResult =>
  html`${swatchStyles}${themingStyles}<div class="ds-page ds-mode">${content}</div>`;

/** Renders a chip filled with `var(token)`, named by its title. */
const chip = (token: string): TemplateResult =>
  html`<div class="th-chip" data-token=${token} title=${token} style="background-color: var(${token})"></div>`;

const stepRow = (prefix: string): TemplateResult =>
  html`<div class="ds-grid">${STEPS.map((step) => swatch(`${prefix}-${step}`))}</div>`;

const meta = {
  title: 'Theming Demos',
  tags: ['!dev'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

export const HueCatalogue: StoryObj = {
  name: 'Hue catalogue',
  render: () =>
    page(html`
      <table class="th-table" data-demo="catalogue">
        <thead>
          <tr>
            <th scope="col">hue</th>
            ${STEPS.map((step) => html`<th scope="col">${step}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${HUES.map(
            (hue) => html`
              <tr data-hue=${hue}>
                <th scope="row">${hue}</th>
                ${STEPS.map((step) => html`<td>${chip(`--line-${hue}-${step}`)}</td>`)}
              </tr>
            `,
          )}
        </tbody>
      </table>
    `),
};

export const AutoPair: StoryObj<AutoPairArgs> = {
  name: 'Auto-pairing',
  args: { accent: 'amber', gray: AUTO_GRAY },
  argTypes: {
    accent: { control: 'select', options: ACCENT_HUES },
    gray: { control: 'select', options: [AUTO_GRAY, ...GRAY_HUES] },
  },
  render: ({ accent, gray }) => {
    const selector = `[data-accent="${accent}"]:not([data-gray])`;
    const note =
      gray === AUTO_GRAY
        ? html`<code>${selector}</code> matches this scope, so the gray role takes the auto-pair of ${accent}.`
        : html`<code>data-gray="${gray}"</code> is set, so <code>${selector}</code> does not match and the gray
            role takes ${gray}.`;
    return page(html`
      <section
        class="ds-panel ds-scope"
        data-demo="auto-pair"
        data-accent=${accent}
        data-gray=${gray === AUTO_GRAY ? nothing : gray}
      >
        <p class="ds-label">${note}</p>
        <p class="ds-label">accent</p>
        ${stepRow('--line-accent')}
        <p class="ds-label">gray</p>
        ${stepRow('--line-gray')}
      </section>
    `);
  },
};

export const LightDark: StoryObj<LightDarkArgs> = {
  name: 'Light and dark',
  args: { scheme: 'dark' },
  argTypes: {
    scheme: { control: 'inline-radio', options: SCHEMES },
  },
  render: ({ scheme }) => html`
    ${swatchStyles}
    <div class="ds-page ds-mode" data-demo="light-dark" style="color-scheme: ${scheme}">
      <p class="ds-label">color-scheme: ${scheme}</p>
      <p class="ds-label">accent</p>
      ${stepRow('--line-accent')}
      <p class="ds-label">gray</p>
      ${stepRow('--line-gray')}
      ${contrastSample('--line-accent')}
    </div>
  `,
};

export const SemanticRoles: StoryObj = {
  name: 'Semantic roles',
  render: () =>
    page(html`
      <section class="ds-panel ds-scope" data-demo="semantic" data-accent="crimson">
        <p class="ds-label">This scope sets data-accent="crimson".</p>
        <div class="th-samples">
          ${contrastSample('--line-accent', ' (crimson)')}
          ${SEMANTIC_ROLES.map((role) => contrastSample(`--line-${role}`, ` (${SEMANTIC_MAP[role]})`))}
        </div>
      </section>
    `),
};

export const AliasMatrix: StoryObj = {
  name: 'Alias matrix',
  render: () =>
    page(html`
      <table class="th-table" data-demo="aliases">
        <thead>
          <tr>
            <th scope="col">role</th>
            ${ALIASES.map((alias) => html`<th scope="col">${alias}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${ROLES.map(
            (role) => html`
              <tr data-role=${role}>
                <th scope="row">${role}</th>
                ${ALIASES.map((alias) => html`<td>${chip(`--line-${role}-${alias}`)}</td>`)}
              </tr>
            `,
          )}
        </tbody>
      </table>
    `),
};
