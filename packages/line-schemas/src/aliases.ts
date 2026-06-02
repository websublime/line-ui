import { z } from 'zod';

/**
 * The 9 semantic alias slots applied to every role. Each role exposes these 9
 * aliases (9 aliases × 6 roles = 54 alias variables in `aliases.css`).
 *
 * Slot → step mapping (per spec §6.C.4 `aliases.css`):
 *   surface → 2, bg → 3, bg-hover → 4, bg-active → 5, border → 7,
 *   solid → 9, solid-hover → 10, text-low → 11, text → 12
 */
export const ALIASES = [
  'surface',
  'bg',
  'bg-hover',
  'bg-active',
  'border',
  'solid',
  'solid-hover',
  'text-low',
  'text',
] as const;

export type Alias = (typeof ALIASES)[number];

export const AliasSchema = z.enum(ALIASES);
