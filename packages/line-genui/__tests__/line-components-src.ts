/**
 * Defines every `line` component from `@websublime/line-components`' own `src/` module, the module instance the
 * `line-components` unit tests import, before a genui test renders one (ledger 01-G4; CI run 41806454034).
 *
 * `bun test` runs every package's test files in one process, with one happy-dom `customElements` registry, in
 * readdir order. A descriptor's `load()` imports `@websublime/line-components/<c>`, which resolves to `dist/`, a
 * second module instance; once it has defined a tag, a later `line-components` test file that imports `src/` throws
 * "already been used with this registry". With the `src/` modules defined first, the surface skips `load()` for a
 * defined tag, and the `src/` module the components tests import is already evaluated, so nothing defines twice.
 * The `load()` behaviour itself (lazy loading, `COMPONENT_LOAD_ERROR`) is tested in a fresh process.
 *
 * The list comes from the descriptors, so a new descriptor cannot be forgotten: each one's tag, `line-<c>`, must name
 * a `src/<c>/index.ts` module that defines it, or importing this helper throws.
 *
 * @module __tests__/line-components-src
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { descriptors } from '../src/catalog/index.js';

for (const { name, tag } of descriptors) {
  const component = /^line-([a-z][a-z0-9-]*)$/.exec(tag)?.[1];
  if (!component) throw new Error(`The ${name} descriptor's tag ${tag} does not name a line component.`);
  const url = new URL(`../../line-components/src/${component}/index.ts`, import.meta.url);
  if (!existsSync(fileURLToPath(url))) throw new Error(`The ${name} descriptor has no source module at ${url}.`);
  await import(url.href);
  if (!customElements.get(tag)) throw new Error(`The source module of ${name} does not define ${tag}.`);
}
