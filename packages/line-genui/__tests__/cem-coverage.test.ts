/**
 * The descriptor coverage test (Phase 1 spec §6.G.5 Acceptance, §7.3; ARCH §17.3; ledger 01-G5).
 *
 * - Every element the built `line-components` `custom-elements.json` declares with a `tagName` has a descriptor.
 *   Inherited `line-core` declarations, such as `LineElement`, carry no `tagName` and are no components.
 * - `<line-a2ui-surface>` lives in the `line-genui` manifest, so the test does not cover it.
 *
 * The manifest is the file the `line-components` build emits, reached by package name, so it needs
 * `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/cem-coverage
 */

import { describe, expect, test } from 'bun:test';
import componentsManifest from '@websublime/line-components/custom-elements.json' with { type: 'json' };
import { descriptors } from '../src/catalog/index.js';
import { coverageViolations, elementsByTag, type Manifest } from './cem-check.js';

const manifest = componentsManifest as Manifest;

describe('descriptor coverage of the built line-components manifest (§6.G.5)', () => {
  test('every line-components element has a descriptor', () => {
    expect(elementsByTag(manifest).size).toBeGreaterThan(0);
    expect(coverageViolations(descriptors, manifest)).toEqual([]);
  });

  test('a component without a descriptor fails', () => {
    const rest = descriptors.filter((descriptor) => descriptor.tag !== 'line-separator');
    expect(coverageViolations(rest, manifest)).toEqual(['line-separator']);
  });

  test('an element added to the manifest without a descriptor fails', () => {
    const badge = { kind: 'class', name: 'LineBadge', tagName: 'line-badge' };
    const grown: Manifest = { modules: [...manifest.modules, { path: 'src/badge/badge.ts', declarations: [badge] }] };
    expect(coverageViolations(descriptors, grown)).toEqual(['line-badge']);
  });
});
