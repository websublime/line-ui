#!/usr/bin/env bun

/**
 * scripts/emit-catalog.mjs — writes `@websublime/line-genui/catalog.json` (ledger 01-G2).
 *
 * It implements docs/specs/01-spec-core-primitives.md §6.G.2 "Catalog file" (§4.1; §10 SD23, SD42; §12 AM-016,
 * L3R10-02):
 *   - run: bun run ../../scripts/emit-catalog.mjs   (zero args, from packages/line-genui)
 *
 * The `line-genui` `build` script runs it right after `vite build` and before `tsc`, because `vite build` empties
 * `dist/` first (`vite.config.shared.mjs` `emptyOutDir`). It imports the emitter from the built
 * `packages/line-genui/dist/catalog/index.js`, so the file comes from the code that ships, and writes the document
 * form of the `line` catalog, with `$defs/anyFunction: false` and an open `$defs/theme`, to
 * `packages/line-genui/dist/catalog.json`. Paths resolve from this file, so the working directory does not matter.
 *
 * It exits non-zero, naming the cause, when the built module is missing or the emitter throws.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'packages', 'line-genui', 'dist');
const EMITTER = join(DIST, 'catalog', 'index.js');
const OUTPUT = join(DIST, 'catalog.json');

async function main() {
  if (!existsSync(EMITTER)) {
    process.stderr.write(
      `emit-catalog: FAIL — ${relative(ROOT, EMITTER)} is missing. Run \`vite build\` in packages/line-genui first.\n`,
    );
    process.exitCode = 1;
    return;
  }

  const { descriptors, lineCatalogDocument } = await import(EMITTER);
  const document = lineCatalogDocument(descriptors);
  writeFileSync(OUTPUT, `${JSON.stringify(document, null, 2)}\n`);

  const components = Object.keys(document.components ?? {});
  console.info(
    `emit-catalog: OK — ${relative(ROOT, OUTPUT)} holds ${document.catalogId} with ${components.length} ` +
      `components (${components.join(', ')}).`,
  );
}

await main();
