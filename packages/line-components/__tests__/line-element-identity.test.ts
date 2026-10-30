/**
 * One `LineElement` across `line-core` and `line-components` in a consumer bundle (Phase 1 spec §7.5
 * `instanceof` harness; §10 SD2; plan §7.4; ledger 01-P5).
 *
 * `line-core` and `line-components` are packed with `stageAndPack` and extracted into one temp `node_modules`
 * (`./packed/consumer.ts`). One esbuild consumer bundle imports `LineElement` from `@websublime/line-core` and
 * every component subpath from `@websublime/line-components`, and runs in a fresh happy-dom realm. Every element
 * a subpath defines must be `instanceof` the imported `LineElement`: `line-components` keeps `line-core` external,
 * so the consumer gets one copy of it. Needs `bun run build` first, as the CI unit tier has.
 *
 * @module __tests__/line-element-identity
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  bundle,
  type Consumer,
  componentSubpaths,
  installPacked,
  runRecordingDefines,
  specifierOf,
} from './packed/consumer.ts';

const COMPONENTS = '@websublime/line-components';
const CORE = '@websublime/line-core';

let consumer: Consumer;

beforeAll(async () => {
  consumer = await installPacked([CORE, COMPONENTS]);
}, 120_000);

afterAll(() => {
  consumer?.cleanup();
});

describe('LineElement identity in a consumer bundle (§7.5, SD2)', () => {
  test('every element a component subpath defines is instanceof the LineElement imported from line-core', async () => {
    const manifest = consumer.packages.get(COMPONENTS)?.manifest;
    if (!manifest) throw new Error(`${COMPONENTS} was not installed`);
    const subpaths = componentSubpaths(manifest);
    const contents = [
      `import { LineElement } from '${CORE}';`,
      ...subpaths.map((subpath) => `import '${specifierOf(COMPONENTS, subpath)}';`),
      'globalThis.__lineElement = LineElement;',
      '',
    ].join('\n');
    const { text } = await bundle(consumer, contents, { format: 'iife' });

    // `LineElement` calls `attachInternals` in its constructor, which happy-dom lacks. happy-dom shares its element
    // classes between windows, so the realm already sees the stand-in `bun-test-preload.ts` installs; one is added
    // only if it is missing, never over the shared prototype.
    const { realm, defined } = runRecordingDefines(text, (r) => {
      r.eval(
        "if (typeof HTMLElement.prototype.attachInternals !== 'function') HTMLElement.prototype.attachInternals = function () { return { host: this }; };",
      );
    });
    try {
      const LineElement = realm.eval('globalThis.__lineElement');
      expect(typeof LineElement).toBe('function');
      expect(defined.length).toBeGreaterThanOrEqual(subpaths.length);
      const notLineElements = defined.filter(
        (tag) => !(realm.document.createElement(tag) instanceof (LineElement as typeof HTMLElement)),
      );
      expect(notLineElements).toEqual([]);
    } finally {
      await realm.happyDOM.close();
    }
  });
});
