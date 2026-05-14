import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

/**
 * Field name targeted by an error state. Empty string means no error.
 */
export type ScLoginErrorField = 'email' | 'password' | '';

/**
 * Detail payload emitted by `sc-login-submit`.
 */
export interface ScLoginSubmitDetail {
  email: string;
  password: string;
}

/**
 * Detail payload emitted by `sc-login-sso`.
 */
export interface ScLoginSsoDetail {
  /** Identifier of the SSO provider — mirrors the `ssoLabel` property */
  provider: string;
}

/**
 * Headless login / sign-up composition block.
 *
 * Defines structure and layout only — no design system tokens internally.
 * Every visual zone is exposed via `::part()` for external styling. Generic
 * CSS custom properties (no `--line-*` prefix) allow structural customisation
 * from the consumer.
 *
 * Mirrors the headless contract established by `sc-product-card`
 * (see docs/specs/00-spec-playground.md §0, §8.3, §16 D1/D4).
 *
 * @fires sc-login-submit - User submitted the form (Enter inside an input or primary CTA click). Detail: `{ email, password }`.
 * @fires sc-login-sso - User clicked the ghost SSO button. Detail: `{ provider }` where `provider` mirrors `ssoLabel`.
 */
@customElement('sc-login-block')
export class ScLoginBlock extends LitElement {
  /** Card heading text */
  @property({ type: String }) heading = 'Sign in';

  /** Optional card subtitle / supporting copy */
  @property({ type: String }) subtitle = '';

  /** Primary CTA label */
  @property({ type: String, attribute: 'submit-label' }) submitLabel = 'Sign in';

  /** Ghost SSO button label */
  @property({ type: String, attribute: 'sso-label' }) ssoLabel = 'GitHub';

  /** Drives the error state on one field. `''` clears all errors. */
  @property({ type: String, attribute: 'error-field' }) errorField: ScLoginErrorField = '';

  /** Inline error copy shown under the affected field */
  @property({ type: String, attribute: 'error-message' }) errorMessage = '';

  @query('input[name="email"]') private _emailInput!: HTMLInputElement;
  @query('input[name="password"]') private _passwordInput!: HTMLInputElement;

  static override styles = css`
    :host {
      --card-radius: 8px;
      --card-padding: 1.75rem;
      --card-gap: 1rem;
      --card-border-width: 1px;

      --heading-font-size: 1.5rem;
      --heading-font-weight: 700;
      --heading-letter-spacing: -0.01em;

      --subtitle-font-size: 0.875rem;
      --subtitle-line-height: 1.6;

      --label-font-size: 0.75rem;
      --label-font-weight: 600;
      --label-letter-spacing: 0.04em;

      --input-height: 40px;
      --input-padding-inline: 0.75rem;
      --input-radius: 4px;
      --input-border-width: 1px;
      --input-font-size: 0.875rem;

      --input-focus-ring-width: 2px;
      --input-focus-ring-offset: 1px;

      --button-padding: 0.75rem 1rem;
      --button-radius: 4px;
      --button-font-size: 0.875rem;
      --button-font-weight: 700;

      --divider-gap: 0.75rem;
      --divider-font-size: 0.75rem;

      --field-error-font-size: 0.75rem;
      --field-error-margin-top: 0.375rem;

      --footer-font-size: 0.8125rem;

      display: block;
    }

    /* ── Card shell ── */
    .card {
      border-radius: var(--card-radius);
      padding: var(--card-padding);
      border: var(--card-border-width) solid transparent;
      display: flex;
      flex-direction: column;
      gap: var(--card-gap);
      box-sizing: border-box;
    }

    /* ── Form ── */
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--card-gap);
      margin: 0;
    }

    /* ── Heading / subtitle ── */
    .heading {
      font-size: var(--heading-font-size);
      font-weight: var(--heading-font-weight);
      letter-spacing: var(--heading-letter-spacing);
      margin: 0;
    }

    .subtitle {
      font-size: var(--subtitle-font-size);
      line-height: var(--subtitle-line-height);
      margin: 0;
    }

    /* ── Field ── */
    .field {
      display: flex;
      flex-direction: column;
    }

    .field-label {
      display: block;
      font-size: var(--label-font-size);
      font-weight: var(--label-font-weight);
      letter-spacing: var(--label-letter-spacing);
      text-transform: uppercase;
      margin-bottom: 0.375rem;
    }

    .field-input {
      box-sizing: border-box;
      width: 100%;
      height: var(--input-height);
      padding: 0 var(--input-padding-inline);
      border-radius: var(--input-radius);
      border: var(--input-border-width) solid transparent;
      font-size: var(--input-font-size);
      font-family: inherit;
      background: transparent;
      color: inherit;
      outline: none;
    }

    /* Default focus-visible — consumer overrides via ::part(input):focus-visible */
    .field-input:focus-visible {
      outline: var(--input-focus-ring-width) solid currentColor;
      outline-offset: var(--input-focus-ring-offset);
    }

    .field-error {
      font-size: var(--field-error-font-size);
      margin-top: var(--field-error-margin-top);
    }

    /* ── Buttons ── */
    .btn {
      box-sizing: border-box;
      width: 100%;
      padding: var(--button-padding);
      border-radius: var(--button-radius);
      font-size: var(--button-font-size);
      font-weight: var(--button-font-weight);
      font-family: inherit;
      cursor: pointer;
      border: var(--input-border-width) solid transparent;
      background: transparent;
      color: inherit;
      transition: background 150ms ease-in-out, color 150ms ease-in-out, border-color 150ms ease-in-out;
    }

    .btn:focus-visible {
      outline: var(--input-focus-ring-width) solid currentColor;
      outline-offset: var(--input-focus-ring-offset);
    }

    /* ── Divider ── */
    .divider {
      display: flex;
      align-items: center;
      gap: var(--divider-gap);
      font-size: var(--divider-font-size);
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: currentColor;
      opacity: 0.4;
    }

    .divider-text {
      flex-shrink: 0;
    }

    /* ── Footer ── */
    .footer-link {
      font-size: var(--footer-font-size);
      margin: 0;
      text-align: center;
    }

    .footer-link-anchor {
      color: inherit;
      text-decoration: none;
      font-weight: 600;
    }

    .footer-link-anchor:hover,
    .footer-link-anchor:focus-visible {
      text-decoration: underline;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    // Spec §10 — Escape clears errors "Anywhere in the block". Registering on
    // the host (rather than the inner <form>) covers focusable elements outside
    // the form (e.g. the SSO button if reordered, footer link, future slots).
    this.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this._onKeydown);
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('errorField')) {
      // Reflect errorField onto the host as `data-error` so consumers can
      // write exclusive `:host([data-error="email"])` / `[data-error="password"]`
      // selectors. We drive this from updated() (instead of property reflect)
      // so the empty case removes the attribute entirely — `data-error=""`
      // would still match `[data-error]`.
      if (this.errorField) {
        this.dataset.error = this.errorField;
      } else {
        delete this.dataset.error;
      }
    }
  }

  private _onSubmit = (event: Event) => {
    event.preventDefault();
    // Optional chaining is defensive — @query refs are null until first render.
    // `_onSubmit` is only callable via the form's submit event (which fires
    // post-render), but keeping the guard protects against future refactors
    // that might call this handler from a different path (programmatic submit,
    // test harness, etc.).
    const email = this._emailInput?.value ?? '';
    const password = this._passwordInput?.value ?? '';
    this.dispatchEvent(
      new CustomEvent<ScLoginSubmitDetail>('sc-login-submit', {
        detail: { email, password },
        bubbles: true,
        composed: true
      })
    );
  };

  private _onSsoClick = () => {
    this.dispatchEvent(
      new CustomEvent<ScLoginSsoDetail>('sc-login-sso', {
        detail: { provider: this.ssoLabel },
        bubbles: true,
        composed: true
      })
    );
  };

  private _onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.errorField = '';
      this.errorMessage = '';
    }
  };

  private _renderField(name: 'email' | 'password', label: string, type: 'email' | 'password', autocomplete: string) {
    const isErrored = this.errorField === name && this.errorMessage !== '';
    const inputParts = isErrored ? 'input input-error' : 'input';
    return html`
      <div class="field" part="field">
        <label class="field-label" part="label" for=${name}>${label}</label>
        <input
          class="field-input"
          part=${inputParts}
          id=${name}
          name=${name}
          type=${type}
          autocomplete=${autocomplete}
          aria-invalid=${isErrored ? 'true' : 'false'}
          aria-describedby=${isErrored ? `${name}-error` : nothing}
        />
        ${
          isErrored
            ? html`
              <div
                class="field-error"
                part="field-error"
                id="${name}-error"
                role="alert"
                data-field=${name}
              >${this.errorMessage}</div>
            `
            : nothing
        }
      </div>
    `;
  }

  override render() {
    return html`
      <div class="card" part="card">
        <form class="form" @submit=${this._onSubmit} novalidate>
          <h2 class="heading" part="heading">${this.heading}</h2>
          ${this.subtitle ? html`<p class="subtitle" part="subtitle">${this.subtitle}</p>` : nothing}

          ${this._renderField('email', 'Email', 'email', 'email')}
          ${this._renderField('password', 'Password', 'password', 'current-password')}

          <button class="btn" part="btn-submit" type="submit">${this.submitLabel}</button>

          <div class="divider" part="divider">
            <span class="divider-text" part="divider-text">or continue with</span>
          </div>

          <!--
            SSO button MUST keep type="button" — it lives inside <form> and
            would otherwise trigger submit when Enter is pressed while focused.
            Do NOT reorder this button outside the form without re-evaluating
            the Tab order (spec §10) and keyboard semantics.
          -->
          <button class="btn" part="btn-sso" type="button" @click=${this._onSsoClick}>
            ${this.ssoLabel}
          </button>

          <p class="footer-link" part="footer-link">
            <span>New here?</span>
            <a class="footer-link-anchor" part="footer-link-anchor" href="#" @click=${(e: Event) => e.preventDefault()}>Create account</a>
          </p>
        </form>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-login-block': ScLoginBlock;
  }
}
