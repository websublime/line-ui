/**
 * All available color schema palette names.
 * Shared between sc-app and sc-nav to avoid duplication.
 */
export const ALL_SCHEMAS = [
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
] as const;

export type SchemaName = (typeof ALL_SCHEMAS)[number];

/** Type alias — palette names and schema names are identical. */
export type PaletteName = SchemaName;

/** Type-safe check that a string is a valid schema name. */
export function isValidSchema(value: string): value is SchemaName {
  return (ALL_SCHEMAS as readonly string[]).includes(value);
}

/** All 12 palette levels (1-based). */
export const PALETTE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type PaletteLevel = (typeof PALETTE_LEVELS)[number];

/**
 * Semantic role description for each palette level.
 * Sourced from the schema CSS mapping (see packages/theme/src/schemas/*.css).
 */
export const LEVEL_ROLES: Record<PaletteLevel, string> = {
  1: 'App background',
  2: 'Subtle background',
  3: 'UI element background',
  4: 'Hovered UI element background',
  5: 'Active / Selected UI element background',
  6: 'Subtle borders and separators',
  7: 'UI element border and focus rings',
  8: 'Hovered UI element border',
  9: 'Solid backgrounds',
  10: 'Hovered solid backgrounds',
  11: 'Low-contrast text',
  12: 'High-contrast text'
};

/**
 * Semantic token name for each palette level.
 * Maps the 12-level scale to the semantic CSS custom property names.
 */
export const LEVEL_SEMANTIC_TOKENS: Record<PaletteLevel, string> = {
  1: '--line-background',
  2: '--line-subtle-background',
  3: '--line-ui-background',
  4: '--line-ui-hover-background',
  5: '--line-ui-active-background',
  6: '--line-subtle-border',
  7: '--line-ui-border',
  8: '--line-ui-border-hover',
  9: '--line-solid-background',
  10: '--line-solid-hover',
  11: '--line-low-contrast',
  12: '--line-high-contrast'
};
