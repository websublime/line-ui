/**
 * Bun test preload (F2 harness).
 *
 * Registers happy-dom globally, then wires `@open-wc/testing-helpers`
 * `fixtureCleanup` to run after every test.
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
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

import { afterEach } from 'bun:test';

const { fixtureCleanup } = await import('@open-wc/testing-helpers/pure');

afterEach(fixtureCleanup);
