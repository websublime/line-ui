/**
 * Bun test preload (F2 harness).
 *
 * Registers a Vite-compatible `*.css?inline` loader, registers happy-dom
 * globally, then wires `@open-wc/testing-helpers` `fixtureCleanup` to run
 * after every test.
 *
 * IMPORTANT — import ordering: `@open-wc/testing-helpers/pure` transitively
 * imports `lit-html`, whose `node` build captures `globalThis.document` **once,
 * at module-evaluation time** (`const l = document ?? stub`). A *static* import
 * of the helper is hoisted above `GlobalRegistrator.register()`, so lit-html
 * would evaluate before the DOM exists and permanently bind to its no-op stub —
 * every lit-mounting test then throws `l.createComment is not a function`. The
 * helper is therefore loaded via a dynamic `import()` AFTER registration so
 * lit-html binds to the real happy-dom `document`.
 */
import { dirname, resolve } from 'node:path';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { plugin } from 'bun';

/**
 * Bun's runtime does not implement Vite's `?inline` query: `import css from
 * './a.css?inline'` yields the file PATH. This plugin gives `bun test` the
 * build-time semantics (spec §6.F.3, AM-026): the default export is the CSS text.
 */
plugin({
  name: 'css-inline',
  setup(build) {
    build.onResolve({ filter: /\.css\?inline$/ }, (args) => ({
      path: resolve(dirname(args.importer), args.path.slice(0, -'?inline'.length)),
      namespace: 'css-inline',
    }));
    build.onLoad({ filter: /.*/, namespace: 'css-inline' }, async (args) => ({
      contents: `export default ${JSON.stringify(await Bun.file(args.path).text())};`,
      loader: 'js',
    }));
  },
});

GlobalRegistrator.register();

import { afterEach } from 'bun:test';

const { fixtureCleanup } = await import('@open-wc/testing-helpers/pure');

afterEach(fixtureCleanup);
