/**
 * Type-level case: the `line-icons` `IconRegistry` satisfies `LineIconRegistry` (Phase 1 spec §6.C.3 "Icon
 * surface acceptance"; spec 0014-icon.md Tests, Type-level row). `typecheck` compiles it through
 * `tsconfig.test.json`; the `export` keeps Biome's `noUnusedVariables` quiet.
 *
 * @module __tests__/registry.types
 */

import { IconRegistry } from '@websublime/line-icons';
import type { LineIconRegistry } from '../src/index.js';

export const r: LineIconRegistry = new IconRegistry();
