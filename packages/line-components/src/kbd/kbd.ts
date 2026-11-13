import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import {
  type ComplexAttributeConverter,
  css,
  html,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import type { KbdPlatform } from './kbd.types.js';
import { drawKeys, type KbdNode, parseKeyLabels, readPlatform, wordLookup } from './keys.js';

const PLATFORMS: readonly KbdPlatform[] = ['auto', 'apple', 'other'];

/** An unknown `platform` behaves as `auto`; the attribute keeps what the author wrote (C8; decision D9). */
const platformConverter: ComplexAttributeConverter<KbdPlatform> = {
  fromAttribute: (value) => PLATFORMS.find((platform) => platform === value) ?? 'auto',
};

/**
 * `<line-kbd>` shows a keyboard shortcut drawn for the user's device. Write the shortcut once in `keys`: join keys
 * pressed together with `+`, such as `mod+shift+p`, and separate keys pressed one after another with a space, such as
 * `g i`. `mod` is the main modifier, Command on Apple devices and Control elsewhere, so `keys="mod+k"` draws `⌘K` on a
 * Mac and `Ctrl+K` elsewhere. Write the `+` key as `plus` and the space bar as `space`. `platform` forces a drawing,
 * `apple` or `other`; the default, `auto`, reads the browser. Glyphs carry hidden words, so assistive technology reads
 * "Command K", and the keys join the name of a control around them.
 *
 * The component only shows the shortcut: the app binds and handles the keys. Put `aria-keyshortcuts` with the app's
 * real binding, such as `Meta+K`, on the control the shortcut triggers. Do not put `aria-label` on the host, because
 * it has no role a name could attach to.
 *
 * While `keys` yields no key, the host shows its own content as written. Write the off-Apple drawing as text inside
 * the host, such as `<line-kbd keys="mod+k">Ctrl+K</line-kbd>`, so the page shows it until the module runs.
 *
 * The words are English by default. Replace them app-wide through `LineKbd.keyLabels`, set before the hosts render,
 * and per host through the `key-labels` attribute, a JSON object. Both map a word id, such as `control` or `then`, or
 * a platform-qualified id, such as `other.control` or `apple.alt`, to a word. The attribute's platform-qualified id
 * wins, then its bare id, then the static's platform-qualified id, then its bare id, then the English default.
 *
 * @summary A keyboard shortcut hint, drawn with glyphs on Apple devices and with words elsewhere.
 *
 * @slot - Text shown as written while `keys` yields no key, such as "Esc" or a key the grammar lacks; not rendered once `keys` yields a key.
 *
 * @csspart root - The whole shortcut: an `inline-flex` row of keys.
 * @csspart item - One key: its box, border, fill and text.
 * @csspart separator - The `+` between the keys of a chord, off Apple only.
 *
 * @cssprop [--line-kbd-bg=var(--line-gray-surface)] - Fill of each `item`.
 * @cssprop [--line-kbd-color=var(--line-gray-text)] - Text colour of each `item`.
 * @cssprop [--line-kbd-border-color=var(--line-gray-border)] - Border colour of each `item`; an unthemed key falls back to `currentColor`.
 * @cssprop [--line-kbd-border-width=var(--line-border-1)] - Border width of each `item`.
 * @cssprop [--line-kbd-radius=var(--line-radius-2)] - Corner radius of each `item`.
 * @cssprop [--line-kbd-padding-inline=var(--line-size-1)] - Inline padding of each `item`.
 * @cssprop [--line-kbd-min-size=var(--line-size-4)] - Minimum block and inline size of each `item`, so one character draws a square key.
 * @cssprop --line-kbd-font-family - Font family of each `item`; unset by default, so the key takes the host's font.
 * @cssprop [--line-kbd-font-size=var(--line-font-size-0)] - Font size of each `item`.
 * @cssprop [--line-kbd-gap=var(--line-size-1)] - Gap of `root`, between keys and separators.
 * @cssprop [--line-kbd-sequence-gap=var(--line-size-2)] - Extra space before the first key of each later step of a sequence.
 * @cssprop [--line-kbd-separator-color=var(--line-gray-text-low)] - Colour of each `separator`.
 */
export class LineKbd extends LineElement {
  /** The words for this host, as a JSON object from a word id to a word; it wins over `LineKbd.keyLabels`. */
  declare keyLabels: string;

  /** The app-wide words, from a word id to a word; read on each update, so set it before the hosts render. */
  static keyLabels: Readonly<Record<string, string>> = {};

  static override properties: PropertyDeclarations = {
    keys: {},
    platform: { reflect: true, useDefault: true, converter: platformConverter },
    keyLabels: { attribute: 'key-labels' },
  };

  static override styles = [
    commonReset,
    css`
      :host {
        --line-kbd-bg: var(--line-gray-surface);
        --line-kbd-color: var(--line-gray-text);
        --line-kbd-border-color: var(--line-gray-border);
        --line-kbd-border-width: var(--line-border-1);
        --line-kbd-radius: var(--line-radius-2);
        --line-kbd-padding-inline: var(--line-size-1);
        --line-kbd-min-size: var(--line-size-4);
        --line-kbd-font-size: var(--line-font-size-0);
        --line-kbd-gap: var(--line-size-1);
        --line-kbd-sequence-gap: var(--line-size-2);
        --line-kbd-separator-color: var(--line-gray-text-low);

        display: inline-flex;
      }

      :host([hidden]) {
        display: none;
      }

      [part='root'] {
        display: inline-flex;
        align-items: center;
        gap: var(--line-kbd-gap);
        font: inherit;
      }

      /* Three border longhands, so an invalid colour token leaves the style solid (spec 0015-kbd.md, CSS custom properties). */
      [part='item'] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-block-size: var(--line-kbd-min-size);
        min-inline-size: var(--line-kbd-min-size);
        padding-inline: var(--line-kbd-padding-inline);
        border-width: var(--line-kbd-border-width);
        border-style: solid;
        border-color: var(--line-kbd-border-color, currentColor);
        border-radius: var(--line-kbd-radius);
        background-color: var(--line-kbd-bg);
        color: var(--line-kbd-color);
        font-family: var(--line-kbd-font-family);
        font-size: var(--line-kbd-font-size);
      }

      [part='item'][data-step] {
        margin-inline-start: var(--line-kbd-sequence-gap);
      }

      [part='separator'] {
        color: var(--line-kbd-separator-color);
      }

      /* The Visually Hidden recipe (spec 0012-visually-hidden.md F5 (d)), repeated because Law 4 forbids the import. */
      .word {
        position: absolute;
        inset-block-start: 0;
        inset-inline-start: 0;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    `,
  ];

  /** The shortcut: keys joined with `+` within a step, and steps separated by whitespace, such as `mod+k` or `g i`. */
  declare keys: string;

  /** Which drawing to use; `auto` reads the browser, and an unknown value behaves as `auto`. */
  declare platform: KbdPlatform;

  /** The drawn shortcut, parsed in `willUpdate`; empty while `keys` yields no key. */
  #nodes: KbdNode[] = [];

  constructor() {
    super();
    this.keys = '';
    // `useDefault` keeps this initial value out of the attribute, so an unknown author value stays (C8).
    this.platform = 'auto';
    this.keyLabels = '';
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    // Re-read on every update, with no cache, so a changed static or browser platform shows next time (D8).
    // `readPlatform` reads through `?.`, so a runtime without `navigator` resolves `other` (F1).
    const platform = this.platform === 'auto' ? readPlatform(globalThis.navigator) : this.platform;
    const lookup = wordLookup(parseKeyLabels(this.keyLabels ?? ''), LineKbd.keyLabels ?? {});
    this.#nodes = drawKeys(this.keys ?? '', platform, lookup);
  }

  override render(): TemplateResult {
    if (this.#nodes.length === 0) return html`<kbd part="root"><slot></slot></kbd>`;
    return html`<kbd part="root">${this.#nodes.map(renderNode)}</kbd>`;
  }
}

/** Maps one node of the drawn shortcut to its element. */
function renderNode(node: KbdNode): TemplateResult {
  switch (node.kind) {
    case 'separator':
      return html`<span part="separator" aria-hidden="true">+</span>`;
    case 'then':
      return html`<span class="word"> ${node.word} </span>`;
    default:
      return node.glyph === undefined
        ? html`<kbd part="item" ?data-step=${node.step}>${node.word}</kbd>`
        : html`<kbd part="item" ?data-step=${node.step}
            ><span aria-hidden="true">${node.glyph}</span><span class="word">${node.word}</span></kbd
          >`;
  }
}

customElements.define('line-kbd', LineKbd);

declare global {
  interface HTMLElementTagNameMap {
    'line-kbd': LineKbd;
  }
}
