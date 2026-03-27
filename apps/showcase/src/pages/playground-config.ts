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
