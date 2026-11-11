import { LineElement } from '@websublime/line-core';
import { commonReset } from '@websublime/line-core/styles';
import { css, html, nothing, type PropertyDeclarations, type PropertyValues, type TemplateResult } from 'lit';

/** The host attributes the avatar copies to `root` (decision F2; D10). */
const NAME_ATTRIBUTES = ['aria-label', 'aria-description'];

/** Where the image stands: no `src`, waiting, loaded or failed (decision F5; D6). */
type ImageStatus = 'none' | 'loading' | 'loaded' | 'error';

let graphemes: Intl.Segmenter | undefined;

/**
 * The initials of `name`: the first grapheme of the first word and, with two or more words, of the last word,
 * uppercased for `lang` (decision F4; D9). An unknown language tag falls back to the default casing.
 */
function initialsOf(name: string, lang: string | undefined): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  graphemes ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : [words[0]];
  const letters = picked.map(
    (word) =>
      graphemes
        ?.segment(word ?? '')
        [Symbol.iterator]()
        .next().value?.segment ?? '',
  );
  const joined = letters.join('');
  try {
    return joined.toLocaleUpperCase(lang || undefined);
  } catch {
    return joined.toUpperCase();
  }
}

/** A trimmed attribute value, or `''` when it is missing or blank. */
function trimmed(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

/**
 * `<line-avatar>` is a small picture that stands for a person or an organisation: a photo, a logo, or the initials
 * of a name when there is no picture. Set `src` to the image URL and `name` to the name. The image shows once it has
 * loaded; while it loads, when it fails and when there is none, the fallback shows: the `fallback` slot, or the
 * initials of `name`. For `srcset`, `<picture>`, lazy loading or an inline SVG logo, put that element in the default
 * slot instead; it replaces the `src` image, and the avatar does not track whether it loads.
 *
 * The avatar is one image to assistive technology, named by the host `aria-label` or else by `name`. Set `name`
 * unless the same name is written next to the avatar; an avatar with no name is decorative and silent. Give custom
 * media `alt=""`, because the avatar's name already covers it. `aria-labelledby` on the host is not supported, since
 * an id reference cannot reach into the shadow root. Name the presence marker in the `status` slot, such as
 * `<line-badge slot="status" variant="success" aria-label="Online">`; it is read after the avatar's name. The avatar
 * takes no focus and fires no event; `data-loading` and `data-error`, with `:state(loading)` and `:state(error)`,
 * follow the image.
 *
 * Every `--line-avatar-*` token is read with its default as a fallback and none is declared on the host, so a
 * container, such as `<line-avatar-group>`, sets size, ring and status visibility by inheritance.
 *
 * @summary A picture, logo or initials that stand for a person or an organisation, with an optional status marker.
 *
 * @slot - Custom media shown in place of the `src` image, such as a `<picture>`, an `<img srcset>`, an inline `<svg>` or a `<line-icon>`; give it `alt=""` or no name.
 * @slot fallback - The fallback content, such as initials written by hand or a `<line-icon>`; when empty, the initials of `name` show.
 * @slot status - One presence marker over the inline-end, block-end corner, such as a named `<line-badge>` dot.
 *
 * @csspart root - The frame: size, radius, fill, ring and clip; carries the `img` role and the name while the avatar is named.
 * @csspart image - The `src` picture.
 * @csspart fallback - The fallback box, centred, holding the initials or the `fallback` slot.
 *
 * @cssprop [--line-avatar-size=var(--line-size-7)] - Inline and block size of the host.
 * @cssprop [--line-avatar-radius=var(--line-radius-round)] - Corner radius of `root`.
 * @cssprop [--line-avatar-bg=var(--line-gray-bg)] - Fill of `root`, behind the fallback and transparent images.
 * @cssprop [--line-avatar-color=var(--line-gray-text)] - Text colour of the fallback.
 * @cssprop [--line-avatar-font-size=calc(var(--line-avatar-size) * 0.4)] - Font size of the fallback.
 * @cssprop [--line-avatar-font-weight=var(--line-font-weight-5)] - Font weight of the fallback.
 * @cssprop [--line-avatar-fit=cover] - `object-fit` of the image.
 * @cssprop [--line-avatar-ring-width=0px] - Spread of the ring drawn around `root`, such as the gap between stacked avatars.
 * @cssprop [--line-avatar-ring-color=var(--line-gray-1, Canvas)] - Colour of the ring.
 * @cssprop [--line-avatar-status-inset=0] - Block-end and inline-end offset of the status marker.
 * @cssprop [--line-avatar-status-visibility=visible] - Visibility of the status marker; `hidden` also hides it from assistive technology.
 */
export class LineAvatar extends LineElement {
  static override properties: PropertyDeclarations = {
    src: {},
    name: {},
  };

  static override styles = [
    commonReset,
    css`
      :host {
        display: inline-block;
        position: relative;
        inline-size: var(--line-avatar-size, var(--line-size-7));
        block-size: var(--line-avatar-size, var(--line-size-7));
      }

      :host([hidden]) {
        display: none;
      }

      [part='root'] {
        display: grid;
        box-sizing: border-box;
        inline-size: 100%;
        block-size: 100%;
        overflow: hidden;
        border-radius: var(--line-avatar-radius, var(--line-radius-round));
        background-color: var(--line-avatar-bg, var(--line-gray-bg));
        box-shadow: 0 0 0 var(--line-avatar-ring-width, 0px) var(--line-avatar-ring-color, var(--line-gray-1, Canvas));
      }

      [part='image'],
      slot:not([name])::slotted(*),
      [part='fallback'] {
        grid-area: 1 / 1;
        inline-size: 100%;
        block-size: 100%;
        min-inline-size: 0;
        min-block-size: 0;
      }

      [part='image'],
      slot:not([name])::slotted(*) {
        object-fit: var(--line-avatar-fit, cover);
      }

      [part='fallback'] {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        line-height: 1;
        white-space: nowrap;
        color: var(--line-avatar-color, var(--line-gray-text));
        font-size: var(--line-avatar-font-size, calc(var(--line-avatar-size, var(--line-size-7)) * 0.4));
        font-weight: var(--line-avatar-font-weight, var(--line-font-weight-5));
      }

      /* The inactive zone keeps its box, so a lazy image in it still loads (spec 0009-avatar.md D5). */
      [part='root']:not([data-shows='image']) [part='image'],
      [part='root'][data-shows='image'] [part='fallback'] {
        visibility: hidden;
      }

      slot[name='status']::slotted(*) {
        position: absolute;
        inset-block-end: var(--line-avatar-status-inset, 0);
        inset-inline-end: var(--line-avatar-status-inset, 0);
        visibility: var(--line-avatar-status-visibility, visible);
      }
    `,
  ];

  static override get observedAttributes(): string[] {
    // biome-ignore lint/complexity/noThisInStatic: `super` runs Lit's getter for LineAvatar; `LineElement.observedAttributes` lists LineElement's attributes only.
    return [...super.observedAttributes, ...NAME_ATTRIBUTES];
  }

  /** The image URL; blank means no image. */
  declare src: string;

  /** The person's or organisation's name: the accessible name unless the host has `aria-label`, and the initials. */
  declare name: string;

  #status: ImageStatus = 'none';

  /** The `src` the status belongs to; events for any other URL are stale and dropped (D6). */
  #tracked = '';

  /** Whether the default slot holds custom media, which replaces the `src` image (decision F1). */
  #media = false;

  constructor() {
    super();
    // A method call, because the manifest analyser lists every `x.name =` statement of a constructor as a field.
    this.#initialise();
  }

  #initialise(): void {
    this.src = '';
    this.name = '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Before the first render the light DOM stands in for the default slot.
    if (!this.hasUpdated) this.#media = [...this.children].some((child) => !child.hasAttribute('slot'));
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (NAME_ATTRIBUTES.includes(name)) this.requestUpdate();
  }

  /** The current non-blank `src`, or `''`. */
  #source(): string {
    const src = this.src ?? '';
    return src.trim() === '' ? '' : src;
  }

  #setStatus(status: ImageStatus): void {
    this.#status = status;
    if (!this.isConnected) return;
    this.reflectState('loading', status === 'loading');
    this.reflectState('error', status === 'error');
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    const src = this.#media ? '' : this.#source();
    if (src === '') {
      this.#tracked = '';
      if (this.#status !== 'none') this.#setStatus('none');
    } else if (src !== this.#tracked) {
      this.#tracked = src;
      this.#setStatus('loading');
    }
  }

  readonly #onLoad = (event: Event): void => {
    this.#settle(event, 'loaded');
  };

  readonly #onError = (event: Event): void => {
    this.#settle(event, 'error');
  };

  #settle(event: Event, status: 'loaded' | 'error'): void {
    const image = event.currentTarget as HTMLImageElement;
    if (this.#tracked === '' || image.getAttribute('src') !== this.#tracked) return;
    this.#setStatus(status);
    this.requestUpdate();
  }

  readonly #onMediaChange = (event: Event): void => {
    this.#readMedia(event.currentTarget as HTMLSlotElement);
  };

  /** Custom media is any element assigned to the default slot; the slot's own `<img>` fallback content is not. */
  #readMedia(slot: HTMLSlotElement): void {
    const media = slot.assignedElements({ flatten: true }).some((element) => element.getRootNode() !== this.renderRoot);
    if (media === this.#media) return;
    this.#media = media;
    this.requestUpdate();
  }

  protected override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    // Reads the default slot once: happy-dom delivers the first `slotchange` before the listener exists.
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])');
    if (slot) this.#readMedia(slot);
  }

  override render(): TemplateResult {
    const label = trimmed(this.getAttribute('aria-label')) || trimmed(this.name);
    const named = label !== '';
    const description = named ? trimmed(this.getAttribute('aria-description')) : '';
    const src = this.#media ? '' : this.#tracked;
    const shows = this.#media || this.#status === 'loaded' ? 'image' : 'fallback';
    const lang = this.closest('[lang]')?.getAttribute('lang') ?? undefined;
    return html`<span
        part="root"
        role=${named ? 'img' : nothing}
        aria-label=${named ? label : nothing}
        aria-description=${description || nothing}
        data-shows=${shows}
        ><slot @slotchange=${this.#onMediaChange}
          >${src ? html`<img part="image" alt="" src=${src} @load=${this.#onLoad} @error=${this.#onError} />` : nothing}</slot
        ><span part="fallback" aria-hidden=${named ? nothing : 'true'}
          ><slot name="fallback">${initialsOf(this.name ?? '', lang)}</slot></span
        ></span
      ><slot name="status"></slot>`;
  }
}

customElements.define('line-avatar', LineAvatar);

declare global {
  interface HTMLElementTagNameMap {
    'line-avatar': LineAvatar;
  }
}
