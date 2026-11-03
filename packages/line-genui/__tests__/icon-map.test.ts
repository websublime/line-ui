/**
 * `@websublime/line-icons/a2ui` against the A2UI v0.9.1 basic catalog (Phase 1 spec §6.C.3, §6.G.2; R10 §2.1;
 * ledger 01-G2).
 *
 * The A2UI fixtures live in this package, the higher layer (§7.8), so the check that the map covers exactly the
 * `Icon.name` enum runs here, through the public `./a2ui` export. It resolves the built `line-icons` `dist/`, so it
 * needs `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/icon-map
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { a2uiIconMap } from '@websublime/line-icons/a2ui';

/** The `Icon.name` enum of the vendored A2UI v0.9.1 basic catalog. */
function basicCatalogIconNames(): string[] {
  const url = new URL('./fixtures/a2ui-v0_9_1/basic_catalog.json', import.meta.url);
  const catalog = JSON.parse(readFileSync(url, 'utf8'));
  const [, , own] = catalog.components.Icon.allOf;
  return own.properties.name.oneOf.find((branch: { enum?: string[] }) => branch.enum).enum;
}

describe('a2uiIconMap covers the A2UI v0.9.1 Icon.name enum (§6.C.3; R10 §2.1)', () => {
  const upstream = basicCatalogIconNames();

  test('the enum holds 59 names', () => {
    expect(upstream).toHaveLength(59);
  });

  test.each(['lucide', 'phosphor'] as const)('the %s map is keyed by exactly those names, in their order', (set) => {
    expect(Object.keys(a2uiIconMap(set, { library: set }))).toEqual(upstream);
  });
});
