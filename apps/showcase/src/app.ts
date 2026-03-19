import { css, html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// Full theme bundle: all color palettes (with dark-mode overrides), schemas,
// tokens, aliases, normalize, and utilities.
import '@websublime/line-theme';

// Navigation component
import './components/sc-nav.js';

// Page imports
import './pages/home.js';
import './pages/colors.js';
import './pages/typography.js';
import './pages/spacing.js';
import './pages/motion.js';
import './pages/surfaces.js';
import './pages/decorative.js';
import './pages/semantic.js';
import './pages/elements.js';
import './pages/themes.js';
import './pages/generator.js';

export type PanelKey =
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'motion'
  | 'surfaces'
  | 'decorative'
  | 'semantic'
  | 'elements'
  | 'themes'
  | 'generator';

const ALL_SCHEMAS = [
  'amber',
  'blue',
  'bronze',
  'brown',
  'crimson',
  'cyan',
  'gold',
  'grass',
  'gray',
  'green',
  'indigo',
  'lime',
  'mauve',
  'mint',
  'olive',
  'orange',
  'pink',
  'plum',
  'purple',
  'red',
  'sage',
  'sand',
  'sky',
  'slate',
  'teal',
  'tomato',
  'violet',
  'yellow'
];

@customElement('sc-app')
export class ScApp extends LitElement {
  @state() private _panel: PanelKey = 'colors';
  @state() private _schema = 'violet';
  @state() private _light = false;

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    main {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: var(--line-size-7, 2rem) var(--line-size-5, 1.5rem);
      box-sizing: border-box;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();

    // Restore persisted mode
    const storedMode = localStorage.getItem('line-mode');
    if (storedMode === 'light') {
      this._light = true;
    }
    // Default is dark (light = false)
    this._applyMode();

    // Restore persisted schema
    const storedSchema = localStorage.getItem('line-schema');
    if (storedSchema && ALL_SCHEMAS.includes(storedSchema)) {
      this._schema = storedSchema;
    }
    this._applySchema();

    // Restore persisted panel
    const storedPanel = localStorage.getItem('line-panel');
    if (storedPanel && this._isValidPanel(storedPanel)) {
      this._panel = storedPanel as PanelKey;
    }
  }

  private _isValidPanel(value: string): value is PanelKey {
    return [
      'colors',
      'typography',
      'spacing',
      'motion',
      'surfaces',
      'decorative',
      'semantic',
      'elements',
      'themes',
      'generator'
    ].includes(value);
  }

  private _applyMode(): void {
    const root = document.documentElement;
    if (this._light) {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }

  private _applySchema(): void {
    const body = document.body;
    for (const cls of Array.from(body.classList)) {
      if (cls.startsWith('line-schema-')) {
        body.classList.remove(cls);
      }
    }
    body.classList.add(`line-schema-${this._schema}`);
  }

  private _handleNavigate(e: Event): void {
    const detail = (e as CustomEvent).detail as { panel: PanelKey };
    this._panel = detail.panel;
    localStorage.setItem('line-panel', this._panel);
  }

  private _handleSchemaChange(e: Event): void {
    const detail = (e as CustomEvent).detail as { schema: string };
    this._schema = detail.schema;
    localStorage.setItem('line-schema', this._schema);
    this._applySchema();
  }

  private _handleModeChange(e: Event): void {
    const detail = (e as CustomEvent).detail as { light: boolean };
    this._light = detail.light;
    localStorage.setItem('line-mode', this._light ? 'light' : 'dark');
    this._applyMode();
  }

  private _renderPanel() {
    switch (this._panel) {
      case 'colors':
        return html`<sc-page-colors></sc-page-colors>`;
      case 'typography':
        return html`<sc-page-typography></sc-page-typography>`;
      case 'spacing':
        return html`<sc-page-spacing></sc-page-spacing>`;
      case 'motion':
        return html`<sc-page-motion></sc-page-motion>`;
      case 'surfaces':
        return html`<sc-page-surfaces></sc-page-surfaces>`;
      case 'decorative':
        return html`<sc-page-decorative></sc-page-decorative>`;
      case 'semantic':
        return html`<sc-page-semantic></sc-page-semantic>`;
      case 'elements':
        return html`<sc-page-elements></sc-page-elements>`;
      case 'themes':
        return html`<sc-page-themes></sc-page-themes>`;
      case 'generator':
        return html`<sc-page-generator></sc-page-generator>`;
      default:
        return nothing;
    }
  }

  override render() {
    return html`
      <sc-nav
        .panel=${this._panel}
        .schema=${this._schema}
        ?light=${this._light}
        @sc-navigate=${this._handleNavigate}
        @sc-schema-change=${this._handleSchemaChange}
        @sc-mode-change=${this._handleModeChange}
      ></sc-nav>
      <main>${this._renderPanel()}</main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-app': ScApp;
  }
}
