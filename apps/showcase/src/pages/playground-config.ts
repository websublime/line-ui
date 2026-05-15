/**
 * Configuration interface for a composition block within the playground page.
 *
 * Each block is a self-contained visual composition that can receive its own
 * `.line-schema-*` class independently from the page base. The accent schema
 * from the nav picker is applied to elements listed in `accentElements`.
 *
 * This interface is intentionally minimal — T7 will expand it with the full
 * schema mapping and accent reactivity system.
 */
export interface PlaygroundBlockConfig {
  /** Unique identifier for this block (e.g., 'login', 'ecommerce', 'music'). */
  id: string;

  /** Schema class to apply to the block wrapper, or null for neutral defaults. */
  baseSchema: string | null;

  /** CSS selectors within the block that receive the nav-picker accent schema. */
  accentElements: string[];
}

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
