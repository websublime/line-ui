import { z } from 'zod';

/**
 * The 6 color roles. `accent` and `gray` are base roles; the remaining four are
 * semantic roles whose default hues come from `SEMANTIC_MAP`.
 */
export const ROLES = ['accent', 'gray', 'success', 'warning', 'danger', 'info'] as const;

export type Role = (typeof ROLES)[number];

export const RoleSchema = z.enum(ROLES);
