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

/** Type-safe check that a string is a valid schema name. */
export function isValidSchema(value: string): value is SchemaName {
  return (ALL_SCHEMAS as readonly string[]).includes(value);
}
