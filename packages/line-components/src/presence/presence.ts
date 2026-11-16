import { LineElement } from '@websublime/line-core';
import { LineMachineController } from '@websublime/line-core/machine';
import { commonReset } from '@websublime/line-core/styles';
import type { Machine } from '@zag-js/core';
import { connect, machine, type Api as PresenceApi } from '@zag-js/presence';
import { css, html, nothing, type PropertyDeclarations, type PropertyValues, type TemplateResult } from 'lit';
import type { LinePresenceEnterCompleteDetail, LinePresenceExitCompleteDetail } from './presence.types.js';

/** The schema of the `@zag-js/presence` machine, which the package does not export by name. */
type PresenceSchema = typeof machine extends Machine<infer T> ? T : never;

/**
 * The normaliser `connect()` takes. The presence API has no element props and never calls it, so every element
 * normaliser returns its props unchanged.
 */
const identity = new Proxy({}, { get: () => (props: object) => props }) as Parameters<typeof connect>[1];

function exitComplete(): CustomEvent<LinePresenceExitCompleteDetail> {
  return new CustomEvent<LinePresenceExitCompleteDetail>('line-exit-complete', {
    detail: { present: false },
    bubbles: true,
    composed: false,
  });
}

function enterComplete(): CustomEvent<LinePresenceEnterCompleteDetail> {
  return new CustomEvent<LinePresenceEnterCompleteDetail>('line-enter-complete', {
    detail: { present: true },
    bubbles: true,
    composed: false,
  });
}

/**
 * `<line-presence>` shows and hides its content with enter and exit animations that the page's own CSS defines.
 * Setting `present` shows the content at once and lets an enter animation play. Clearing it keeps the content on
 * screen while the exit animation plays, then hides it. The `@zag-js/presence` machine watches the animation of
 * `::part(root)` and decides when the exit ends. Hidden content stays in the document with its state, but it leaves
 * the screen, the Tab order and the accessibility tree. Presence adds no role and no meaning, and ships no animation:
 * without the page's CSS it shows and hides in one frame.
 *
 * Animate `::part(root)` with CSS animations keyed on the host state, with distinct keyframe names for the enter
 * and the exit, and gate them for reduced motion:
 *
 * ```css
 * @media (prefers-reduced-motion: no-preference) {
 *   line-presence.panel[data-open]::part(root) {
 *     animation: panel-in 150ms ease-out;
 *   }
 *   line-presence.panel:not([data-open])::part(root) {
 *     animation: panel-out 120ms ease-in;
 *   }
 * }
 * ```
 *
 * - The machine waits only for CSS animations. `animation: none`, a `0s` duration, `display: none` or a CSS
 *   transition end the exit in one frame.
 * - The same keyframes for the enter and the exit, played in reverse, end every exit after the enter animation has finished, or after a reopen, at once.
 * - Removing the host cuts the exit, and no `line-exit-complete` fires.
 * - Content that holds focus keeps it while it exits, and focus goes to `body` when the exit ends; move focus first,
 *   usually back to the trigger.
 * - Hidden form controls still submit, as any `display: none` control does; disable them as well.
 * - A close during an enter animation can skip the exit in Chromium and Firefox, because the machine unmounts on the
 *   enter animation's `animationcancel` (https://github.com/chakra-ui/zag/issues/3656). Fast toggling in Firefox can
 *   fire several `line-exit-complete` events, the last while the presence is open again, so a handler checks
 *   `present` before it acts.
 *
 * Closed content shows until the module runs. To hide it before the upgrade, add this rule to the page:
 *
 * ```css
 * line-presence:not(:defined):not([present]) {
 *   display: none;
 * }
 * ```
 *
 * Do not put `aria-label` on the host, because it has no role a name could attach to. A trigger carries
 * `aria-expanded` and `aria-controls` itself.
 *
 * @summary Content that the page shows and hides with its own enter and exit animations.
 *
 * @slot - The content that enters and exits: any content.
 *
 * @csspart root - The box that wraps the content; animate it through `::part(root)`. It is `hidden` after an exit.
 *
 * @fires {CustomEvent<LinePresenceExitCompleteDetail>} line-exit-complete - An exit ended and the content is hidden; `detail.present` is `false`. Bubbles, not composed. Never fires at the first render, for an exit a reopen cuts, or when the host is removed mid-exit.
 * @fires {CustomEvent<LinePresenceEnterCompleteDetail>} line-enter-complete - An enter after the first render ended and the content is shown; `detail.present` is `true`. Bubbles, not composed.
 */
export class LinePresence extends LineElement {
  static override properties: PropertyDeclarations = {
    present: { type: Boolean, reflect: true },
    skipAnimationOnMount: { type: Boolean, reflect: true, attribute: 'skip-animation-on-mount' },
  };

  // `display: contents` gives the host no box, so `root` is the box that animates; `:host([hidden])` keeps `hidden`
  // working over it (spec 0017-presence.md D3). `commonReset` holds a hidden `root` against page rules (D4). The
  // `skip` class blocks a page animation at the first render while `skip-animation-on-mount` holds (D6).
  static override styles = [
    commonReset,
    css`
      :host {
        display: contents;
      }

      :host([hidden]) {
        display: none;
      }

      [part='root'] {
        display: block;
      }

      [part='root'].skip {
        animation: none !important;
      }
    `,
  ];

  /** Shows the content; clearing it plays the exit animation, then hides the content. */
  declare present: boolean;
  /**
   * Blocks any `root` animation from each connection until `present` first changes after it, so content open at
   * load or reinserted does not play its enter animation.
   */
  declare skipAnimationOnMount: boolean;

  /** The completion event the next update dispatches; the latest machine callback wins (D8). */
  #pending: CustomEvent | null = null;
  /** Whether an update has completed, so the fallback fires no event for the first one (D24). */
  #settled = false;

  readonly #onExitComplete = (): void => {
    this.#pending = exitComplete();
    this.requestUpdate();
  };

  readonly #onEnterComplete = (): void => {
    this.#pending = enterComplete();
    this.requestUpdate();
  };

  /** The machine props, read live; `present` is always a boolean. */
  readonly #machineProps = () => ({
    present: this.present === true,
    onExitComplete: this.#onExitComplete,
    onEnterComplete: this.#onEnterComplete,
  });

  readonly #ctrl = new LineMachineController<PresenceSchema>(this, { machine, props: this.#machineProps });

  constructor() {
    super();
    this.present = false;
    this.skipAnimationOnMount = false;
  }

  /** The machine's API, or `null` when the machine failed to start or the host is disconnected. */
  #api(): PresenceApi | null {
    const service = this.#ctrl.service;
    return service && !this.#ctrl.fallback ? connect(service, identity) : null;
  }

  /** Hands `root` to the machine, which tracks its animations. */
  #setNode(): void {
    const root = this.renderRoot.querySelector<HTMLElement>('[part="root"]');
    if (root) this.#api()?.setNode(root);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The controller built a new machine; a host reconnected mid-exit renders from it (spec 0017-presence.md D7).
    this.requestUpdate();
    if (this.hasUpdated) this.#setNode();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // A host removed before the dispatching update fires nothing (D8).
    this.#pending = null;
  }

  protected override firstUpdated(changed: PropertyValues<this>): void {
    super.firstUpdated(changed);
    this.#setNode();
  }

  protected override update(changed: PropertyValues<this>): void {
    this.reflectState('open', this.present === true);
    super.update(changed);
  }

  override render(): TemplateResult {
    const api = this.#api();
    const shown = api ? api.present : this.present === true;
    const skip = api !== null && this.skipAnimationOnMount && api.skip;
    return html`<div part="root" class=${skip ? 'skip' : nothing} ?hidden=${!shown}><slot></slot></div>`;
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const first = !this.#settled;
    this.#settled = true;
    if (this.#ctrl.fallback) {
      // Without a machine, `root` follows `present` at once, so each change completes in this update (D24).
      const previous = changed.get('present') === true;
      if (!first && changed.has('present') && previous !== (this.present === true)) {
        this.dispatchEvent(this.present === true ? enterComplete() : exitComplete());
      }
      return;
    }
    const event = this.#pending;
    this.#pending = null;
    if (event) this.dispatchEvent(event);
  }
}

customElements.define('line-presence', LinePresence);

declare global {
  interface HTMLElementTagNameMap {
    'line-presence': LinePresence;
  }
}
