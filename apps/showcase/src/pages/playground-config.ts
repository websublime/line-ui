/**
 * One styleable zone inside a block that can be toggled accent-reactive.
 *
 * The `selector` is a DASH-form identifier that maps either to a real
 * `::part()` name on the block (e.g. `btn-submit`, `chip-active`) or to a
 * LOGICAL identifier translated by `sc-page-playground` into a concrete
 * `::part()` rule (e.g. `input-focus` → `::part(input):focus-visible`).
 *
 * See `docs/specs/00-spec-playground.md` §14.2.
 */
export interface BlockElementConfig {
  /** CSS selector fragment (without the leading dot) applied to the zone. */
  selector: string;
  /** Human label shown in sc-schema-mapper. */
  label: string;
  /** Whether the zone currently inherits the picker accent. */
  accentReactive: boolean;
}

/**
 * One composition block's accent-reactivity configuration.
 *
 * Each block carries a `baseSchema` (palette name applied to its neutral
 * surfaces — does NOT react to the picker) and a list of accent-reactive
 * `elements` whose participation can be toggled at runtime via
 * `<sc-schema-mapper>`.
 *
 * The optional `complementSchema` is only relevant for `<sc-pricing-block>`:
 * it is consumed by `sc-page-playground` to derive the inline
 * `--complement-*` host custom properties (spec §14.5 mechanism 2).
 *
 * See `docs/specs/00-spec-playground.md` §14.2.
 */
export interface PlaygroundBlockConfig {
  /** Unique block identifier ('login' | 'product' | 'player' | 'dashboard' | 'pricing'). */
  id: string;
  /** Sidebar title. */
  title: string;
  /** Schema applied to the block root wrapper. null = neutral defaults. */
  baseSchema: string | null;
  /** Complementary schema (only relevant for sc-pricing-block). */
  complementSchema?: string;
  /** Zones within the block whose accent reactivity can be toggled. */
  elements: BlockElementConfig[];
}

/**
 * Default composition-block configuration consumed by `sc-page-playground`
 * on mount. The constant MUST be deep-cloned (`structuredClone`) before being
 * stored as page state so toggles do not mutate this exported reference —
 * page reload then guarantees a fresh default set (spec §14, acceptance:
 * "_configs is reset to DEFAULT_BLOCK_CONFIGS on page reload").
 *
 * Selectors use the DASH-form `::part()` names exposed by the existing block
 * components, except for two LOGICAL identifiers:
 *   - `input-focus` (login) → no real part, gates the consumer rule
 *     `::part(input):focus-visible`.
 *   - `add-to-cart` (product) → maps to the real part `button`.
 *
 * Translation is performed at the consumer side (`sc-page-playground`).
 */
export const DEFAULT_BLOCK_CONFIGS: PlaygroundBlockConfig[] = [
  {
    id: 'login',
    title: 'Login / Sign-up',
    baseSchema: 'slate',
    elements: [
      { selector: 'btn-submit', label: 'Submit button', accentReactive: true },
      { selector: 'input-focus', label: 'Input focus ring', accentReactive: true }
    ]
  },
  {
    id: 'product',
    title: 'Product Card',
    baseSchema: 'slate',
    elements: [
      { selector: 'price', label: 'Price badge', accentReactive: true },
      { selector: 'add-to-cart', label: 'Add to Cart button', accentReactive: true },
      { selector: 'chip-active', label: 'Active size chip', accentReactive: true }
    ]
  },
  {
    id: 'player',
    title: 'Music Player',
    baseSchema: 'gray',
    elements: [
      { selector: 'progress-fill', label: 'Progress bar', accentReactive: true },
      { selector: 'ctrl-play', label: 'Play button', accentReactive: true },
      { selector: 'playlist-item-active', label: 'Active playlist row', accentReactive: true }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    baseSchema: 'sand',
    elements: [
      { selector: 'stat-card-accent', label: 'Accent stat card', accentReactive: true },
      { selector: 'toggle-on', label: 'Toggle (on)', accentReactive: true }
    ]
  },
  {
    id: 'pricing',
    title: 'Pricing Table',
    baseSchema: null,
    elements: [
      { selector: 'tier-card-featured', label: 'Pro tier card', accentReactive: true },
      {
        selector: 'tier-card-enterprise',
        label: 'Enterprise tier (complement)',
        accentReactive: false
      },
      { selector: 'cta-solid', label: 'Pro CTA button', accentReactive: true }
    ]
  }
];

/**
 * The 28 palette names supported by `line://ui`. Used as the literal-union
 * key/value type for `COMPLEMENT_MAP` so palette typos are caught at compile
 * time (cosmetic review fix for line-ui-m3d.6).
 */
export type Palette =
  | 'amber'
  | 'blue'
  | 'bronze'
  | 'brown'
  | 'crimson'
  | 'cyan'
  | 'gold'
  | 'grass'
  | 'gray'
  | 'green'
  | 'indigo'
  | 'lime'
  | 'mauve'
  | 'mint'
  | 'olive'
  | 'orange'
  | 'pink'
  | 'plum'
  | 'purple'
  | 'red'
  | 'sage'
  | 'sand'
  | 'sky'
  | 'slate'
  | 'teal'
  | 'tomato'
  | 'violet'
  | 'yellow';

/**
 * Static lookup table used by `<sc-pricing-block>` to resolve the
 * complementary schema for the Enterprise tier from the active accent.
 *
 * The map is intentionally not algorithmic — it forms part of the documented
 * "composition recipe" referenced by future homepage work
 * (see `docs/specs/00-spec-playground.md` §14.3).
 */
export const COMPLEMENT_MAP: Record<Palette, Palette> = {
  // warm → cool
  amber: 'indigo',
  orange: 'indigo',
  tomato: 'indigo',
  red: 'violet',
  crimson: 'violet',
  pink: 'teal',
  yellow: 'blue',
  // cool → warm
  blue: 'amber',
  indigo: 'amber',
  violet: 'orange',
  purple: 'lime',
  cyan: 'pink',
  teal: 'pink',
  sky: 'orange',
  mint: 'crimson',
  green: 'plum',
  grass: 'plum',
  lime: 'purple',
  // neutrals → accents
  mauve: 'teal',
  slate: 'amber',
  gray: 'blue',
  sand: 'violet',
  sage: 'crimson',
  olive: 'violet',
  // earth → cool
  bronze: 'sky',
  gold: 'sky',
  brown: 'sky',
  plum: 'green'
};

/**
 * Resolve the complementary schema for a given accent schema.
 *
 * Accepts a loose `string` at the boundary (callers like `playground.ts`
 * type `schema` as `string`) and narrows internally via the
 * `COMPLEMENT_MAP` key set. Falls back to `indigo` for unknown accent
 * inputs so the Enterprise tier always renders a defined accent.
 */
export const complementSchema = (accent: string): Palette =>
  (COMPLEMENT_MAP as Record<string, Palette | undefined>)[accent] ?? 'indigo';
