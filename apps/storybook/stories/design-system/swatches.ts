import { html, type TemplateResult } from 'lit';

// Shared markup for the design-system stories. Colours come only from
// var(--line-*); the classes below set layout.

export const MODES = ['light', 'dark'] as const;

export type Mode = (typeof MODES)[number];

export const swatchStyles = html`<style>
  .ds-page {
    display: grid;
    gap: 24px;
    padding: 24px;
    font: 13px/1.4 system-ui, sans-serif;
  }
  .ds-mode {
    background-color: var(--line-gray-1);
    color: var(--line-gray-12);
  }
  .ds-panel {
    display: grid;
    gap: 12px;
  }
  .ds-scope {
    padding: 16px;
    border: 1px solid var(--line-gray-6);
    border-radius: 8px;
    background-color: var(--line-gray-1);
  }
  .ds-modes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .ds-modes > .ds-mode {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
  }
  .ds-title,
  .ds-label {
    margin: 0;
    font-weight: 600;
  }
  .ds-title {
    font-size: 16px;
  }
  .ds-label {
    font-size: 13px;
  }
  .ds-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 4px;
  }
  .ds-swatch {
    display: grid;
    gap: 2px;
    min-width: 0;
    margin: 0;
  }
  .ds-chip {
    height: 32px;
    border-radius: 4px;
  }
  .ds-token {
    font: 9px/1.2 ui-monospace, monospace;
    overflow-wrap: anywhere;
    color: var(--line-gray-11);
  }
  .ds-contrast {
    padding: 8px 12px;
    border-radius: 4px;
    /* WCAG large text (14pt bold), so axe applies the 3:1 floor the palette is validated to. */
    font-size: 19px;
    font-weight: 700;
  }
</style>`;

/** Renders one chip filled with `var(token)` and labels it with the token name. */
export const swatch = (token: string): TemplateResult => html`
  <figure class="ds-swatch" data-token=${token}>
    <div class="ds-chip" style="background-color: var(${token})"></div>
    <figcaption class="ds-token">${token}</figcaption>
  </figure>
`;

/** Renders text in `{prefix}-contrast` on a `{prefix}-9` fill, e.g. prefix `--line-amber`. */
export const contrastSample = (prefix: string, note = ''): TemplateResult => html`
  <div
    class="ds-contrast"
    data-contrast=${prefix}
    style="background-color: var(${prefix}-9); color: var(${prefix}-contrast)"
  >
    ${prefix}-contrast${note} on ${prefix}-9
  </div>
`;
