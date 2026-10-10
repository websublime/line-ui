import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';

import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { LineElement } from '@websublime/line-core';
import { buttonReset, commonReset } from '@websublime/line-core/styles';
import { css, html, type TemplateResult } from 'lit';

// Demo stories for the Customisation guide (customisation.mdx). The '!dev' tag
// keeps them out of the sidebar, and the guide embeds them with <Canvas of>.
//
// The stories import only the token families the demo uses. The line-tokens
// barrel carries reset.css, which would restyle the docs page.

/**
 * A hand-rolled button with the shape of a Phase 1 component. Every rendered
 * shadow node carries a part, and the parts consume only component tokens.
 */
class LineDemoButton extends LineElement {
  static override styles = [
    commonReset,
    buttonReset,
    css`
      :host {
        --line-demo-button-radius: var(--line-radius-2);
        --line-demo-button-bg: var(--line-accent-solid);
        --line-demo-button-color: var(--line-accent-contrast);
        --line-demo-button-padding-x: var(--line-size-3);
        --line-demo-button-padding-y: var(--line-size-2);
        --line-demo-button-font-size: var(--line-font-size-1);

        display: inline-block;
      }

      [part='root'] {
        border-radius: var(--line-demo-button-radius);
        background-color: var(--line-demo-button-bg);
        color: var(--line-demo-button-color);
        padding: var(--line-demo-button-padding-y) var(--line-demo-button-padding-x);
        font-size: var(--line-demo-button-font-size);
      }
    `,
  ];

  override render(): TemplateResult {
    return html`<button part="root"><span part="label"><slot></slot></span></button>`;
  }
}

// A module re-run (HMR) must not define the tag twice.
if (!customElements.get('line-demo-button')) {
  customElements.define('line-demo-button', LineDemoButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'line-demo-button': LineDemoButton;
  }
}

const customisationStyles = html`<style>
  .cu-page {
    padding: 16px;
  }
  .cu-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  .cu-case {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
  }
  .cu-page .cu-restyled::part(root) {
    background-color: var(--line-gray-bg);
    border: var(--line-border-1) solid var(--line-gray-border);
    border-radius: var(--line-radius-round);
  }
  .cu-page .cu-restyled::part(label) {
    color: var(--line-gray-text);
    font-weight: var(--line-font-weight-6);
  }
  .cu-page .cu-tier1 {
    --line-radius-2: var(--line-radius-4);
  }
  .cu-page .cu-tier3 {
    --line-demo-button-bg: var(--line-success-solid);
    --line-demo-button-color: var(--line-success-contrast);
    --line-demo-button-radius: var(--line-radius-round);
  }
  .cu-page .cu-ancestor {
    --line-demo-button-bg: var(--line-success-solid);
    --line-demo-button-radius: var(--line-radius-round);
  }
  .cu-page .cu-part {
    --line-demo-button-bg: var(--line-success-solid);
  }
  .cu-page .cu-part::part(root) {
    background-color: var(--line-danger-solid);
    border-radius: var(--line-radius-1);
  }
  .cu-page .cu-part::part(label) {
    color: var(--line-danger-contrast);
  }
</style>`;

const demoCase = (label: string, content: TemplateResult): TemplateResult =>
  html`<div class="cu-case">${content}<span>${label}</span></div>`;

const meta = {
  title: 'Customisation Demos',
  tags: ['!dev'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The default element next to one restyled through `::part(root)` and `::part(label)`. */
export const Parts: Story = {
  render: () =>
    html`${customisationStyles}<div class="cu-page"><div class="cu-row">
      ${demoCase('Default', html`<line-demo-button>Save</line-demo-button>`)}
      ${demoCase('::part(root) and ::part(label)', html`<line-demo-button class="cu-restyled">Save</line-demo-button>`)}
    </div></div>`,
};

/** One instance per cascade claim in the guide, (a) to (e). */
export const Tiers: Story = {
  render: () =>
    html`${customisationStyles}<div class="cu-page"><div class="cu-row">
      ${demoCase('(a) Defaults', html`<line-demo-button data-case="a">Save</line-demo-button>`)}
      ${demoCase(
        '(b) Tier 1 on an ancestor',
        html`<div class="cu-tier1" data-accent="crimson">
          <line-demo-button data-case="b">Save</line-demo-button>
        </div>`,
      )}
      ${demoCase('(c) Tier 3 on the element', html`<line-demo-button class="cu-tier3" data-case="c">Save</line-demo-button>`)}
      ${demoCase(
        '(d) Component token on an ancestor',
        html`<div class="cu-ancestor">
          <line-demo-button data-case="d">Save</line-demo-button>
        </div>`,
      )}
      ${demoCase('(e) ::part() over the tokens', html`<line-demo-button class="cu-part" data-case="e">Save</line-demo-button>`)}
    </div></div>`,
};
