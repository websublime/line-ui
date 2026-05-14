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
 * Static lookup table used by `<sc-pricing-block>` to resolve the
 * complementary schema for the Enterprise tier from the active accent.
 *
 * The map is intentionally not algorithmic — it forms part of the documented
 * "composition recipe" referenced by future homepage work
 * (see `docs/specs/00-spec-playground.md` §14.3).
 */
export const COMPLEMENT_MAP: Record<string, string> = {
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
 * Falls back to `indigo` for unknown accent inputs so the Enterprise tier
 * always renders a defined accent.
 */
export const complementSchema = (accent: string): string => COMPLEMENT_MAP[accent] ?? 'indigo';
