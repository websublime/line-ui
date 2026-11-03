/**
 * The A2UI session of `@websublime/line-genui/a2ui` (Phase 1 spec §6.G.4 "Upstream pin", "Projection and
 * messages", "Errors", URLs; ledger 01-G4).
 *
 * - `@a2ui/web_core` is pinned exactly at `0.14.0`, and no `line-genui` source imports `lit`, `A2uiLitElement`, or
 *   a `line-core` module that loads `lit`.
 * - The `line` and `basic` registrations are always on; each message goes through its own `processMessages`
 *   call under `RELAXED_VALIDATION`, so `[ok, invalid, ok]` applies the first and third and raises one error.
 * - A self-cycle rejects its message; every `web_core` throw becomes `line-a2ui-error` with its `web_core` code.
 * - The session's `openUrl` takes the default allowlist, runs behind the URL policy and only on a user activation
 *   (AM-075, AM-076).
 * - Every emitted message validates against `client_to_server.json`.
 *
 * @module __tests__/a2ui-session
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Session } from '../src/a2ui/index.js';
import { BASIC_CATALOG_ID, LINE_CATALOG_ID } from '../src/catalog/index.js';
import {
  action,
  components,
  create,
  data,
  invalidMessages,
  message,
  mount,
  SURFACE,
  text,
  tick,
} from './a2ui-fixture.js';

afterEach(() => {
  expect(invalidMessages).toEqual([]);
});

const SRC = new URL('../src/', import.meta.url).pathname;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sources(join(dir, entry.name)) : entry.name.endsWith('.ts') ? [join(dir, entry.name)] : [],
  );
}

/** Every module specifier a source file imports or re-exports, with `import type` lines left out. */
function runtimeImports(file: string): string[] {
  const transpiler = new Bun.Transpiler({ loader: 'ts' });
  return transpiler.scanImports(readFileSync(file, 'utf8')).map((entry) => entry.path);
}

describe('upstream pin and module rules (§6.G.4)', () => {
  test('package.json lists @a2ui/web_core as exactly 0.14.0', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(manifest.dependencies['@a2ui/web_core']).toBe('0.14.0');
  });

  test('no line-genui source imports lit, A2uiLitElement or a lit-loading line-core module', () => {
    const offenders: string[] = [];
    for (const file of sources(SRC)) {
      const source = readFileSync(file, 'utf8');
      if (/A2uiLitElement/.test(source)) offenders.push(`${file}: A2uiLitElement`);
      for (const specifier of runtimeImports(file)) {
        const lit = /^(lit|lit-html|lit-element|@lit\/[^/]+)(\/|$)/.test(specifier);
        const core =
          specifier === '@websublime/line-core' || specifier === '@websublime/line-core/mixins/form-associated';
        if (lit || core) offenders.push(`${file}: ${specifier}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('registrations and processing (§6.G.4 Projection and messages)', () => {
  test('the line and basic catalogs are both registered', () => {
    const session = new Session();
    const errors: unknown[] = [];
    session.onError((error) => errors.push(error));
    expect(session.process([create(LINE_CATALOG_ID, 'a'), create(BASIC_CATALOG_ID, 'b')], 'a')).toBe(2);
    expect(errors).toEqual([]);
  });

  test('[ok, invalid, ok] applies the first and third message and raises one error', async () => {
    const { feed, errors, session } = mount();
    await feed(create(), components([{ id: 'root', component: 'Column', children: ['t'] }, text('t', { path: '/a' })]));
    const applied = await feed(
      data('/a', 'first'),
      components([{ id: 'bad', component: 'Button', child: 't', variant: 'huge', action: action('x') }]),
      data('/b', 'third'),
    );
    expect(applied).toBe(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.error.code).toBe('VALIDATION_ERROR');
    expect(session.dataModel(SURFACE)).toBeUndefined();
    expect(document.querySelector('line-a2ui-surface p')?.textContent).toBe('first');
  });

  test('RELAXED_VALIDATION: components before their root, and a dangling child, apply', async () => {
    const { feed, errors } = mount();
    const applied = await feed(
      create(),
      components([text('t1', 'Orphan')]),
      components([{ id: 'root', component: 'Column', children: ['t1', 'ghost'] }]),
    );
    expect(applied).toBe(3);
    expect(errors).toEqual([]);
  });

  test('a self-cycle rejects its message with a RECURSION_ERROR', async () => {
    const { feed, errors, surface } = mount();
    await feed(create(), components([{ id: 'root', component: 'Column', children: ['ok'] }, text('ok', 'Kept')]));
    const applied = await feed(components([{ id: 'loop', component: 'Column', children: ['loop'] }]));
    expect(applied).toBe(0);
    expect(errors.map((e) => e.error.code)).toEqual(['RECURSION_ERROR']);
    expect(surface.textContent).toBe('Kept');
  });

  test('a web_core throw carries its web_core code', async () => {
    const { feed, errors, session } = mount();
    const all: string[] = [];
    session.onError((error) => all.push(`${error.error.surfaceId}:${error.error.code}`));
    await feed(
      create('https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json'),
      create(),
      create(),
      data('/x', 1, 'nope'),
    );
    expect(errors.map((e) => e.error.code)).toEqual(['CATALOG_ERROR', 'INTEGRITY_ERROR']);
    expect(all).toEqual([`${SURFACE}:CATALOG_ERROR`, `${SURFACE}:INTEGRITY_ERROR`, 'nope:INTEGRITY_ERROR']);
  });

  test('a message that names no surface reports on the fallback surface', () => {
    const session = new Session();
    const errors: { error: { surfaceId: string; code: string } }[] = [];
    session.onError((error) => errors.push(error));
    session.process([{ nonsense: true }, 'text'], 'fallback');
    expect(errors.map((e) => [e.error.surfaceId, e.error.code])).toEqual([
      ['fallback', 'VALIDATION_ERROR'],
      ['fallback', 'VALIDATION_ERROR'],
    ]);
  });

  test('an error carries the generic A2UI form', async () => {
    const { feed, errors } = mount();
    await feed(create(), create());
    expect(errors).toEqual([
      {
        version: 'v0.9.1',
        error: { code: 'INTEGRITY_ERROR', surfaceId: SURFACE, message: expect.any(String) },
      },
    ]);
  });

  test('an action carries the resolved A2UI action message', async () => {
    const { feed, actions, surface } = mount();
    await feed(
      create(),
      components([
        { id: 'root', component: 'Button', child: 'l', action: action('send', { to: { path: '/to' } }) },
        text('l', 'Send'),
      ]),
      data('/to', 'Ada'),
    );
    surface.querySelector('line-button')?.click();
    await tick();
    expect(actions).toEqual([
      {
        version: 'v0.9.1',
        action: {
          name: 'send',
          surfaceId: SURFACE,
          sourceComponentId: 'root',
          timestamp: expect.any(String),
          context: { to: 'Ada' },
        },
      },
    ]);
  });

  test('a deleteSurface clears the render', async () => {
    const { feed, surface } = mount();
    await feed(create(), components([text('root', 'Here')]));
    expect(surface.textContent).toBe('Here');
    await feed(message({ deleteSurface: { surfaceId: SURFACE } }));
    expect(surface.childElementCount).toBe(0);
  });
});

describe('openUrl (§6.G.4 URLs; AM-075, AM-076)', () => {
  const opened: string[] = [];
  const open = window.open;

  async function clickOpen(url: string, attributes: Record<string, string> = {}) {
    opened.length = 0;
    window.open = ((href: string) => {
      opened.push(href);
      return null;
    }) as typeof window.open;
    const mounted = mount(attributes);
    await mounted.feed(
      create(),
      components([
        {
          id: 'root',
          component: 'Button',
          child: 'l',
          action: { functionCall: { call: 'openUrl', args: { url }, returnType: 'void' } },
        },
        text('l', 'Open'),
      ]),
    );
    return mounted;
  }

  afterEach(() => {
    window.open = open;
    Reflect.deleteProperty(navigator, 'userActivation');
  });

  test('https:, http:, mailto: and tel: URLs open on a click', async () => {
    for (const url of ['https://example.com/a', 'http://example.com/b', 'mailto:a@example.com', 'tel:+351000']) {
      const { surface } = await clickOpen(url);
      surface.querySelector('line-button')?.click();
      await tick();
      expect(opened).toEqual([url]);
      surface.remove();
    }
  });

  test('data:, javascript: and other schemes never open', async () => {
    for (const url of [
      'data:text/html,x',
      'javascript:alert(1)',
      'ftp://example.com/a',
      'blob:https://example.com/x',
    ]) {
      const { surface } = await clickOpen(url);
      surface.querySelector('line-button')?.click();
      await tick();
      expect(opened).toEqual([]);
      surface.remove();
    }
  });

  test('a urlPolicy that rejects the URL, or throws, keeps it from openUrl', async () => {
    for (const policy of [
      () => false,
      () => {
        throw new Error('no');
      },
    ]) {
      const { surface } = await clickOpen('https://example.com/a');
      surface.urlPolicy = policy;
      surface.querySelector('line-button')?.click();
      await tick();
      expect(opened).toEqual([]);
      surface.remove();
    }
  });

  test('requiresUserActivation: a passive openUrl call opens nothing and is reported', async () => {
    opened.length = 0;
    window.open = ((href: string) => {
      opened.push(href);
      return null;
    }) as typeof window.open;
    const { feed, errors } = mount();
    await feed(
      create(),
      components([
        text('root', {
          call: 'formatString',
          args: { value: { call: 'openUrl', args: { url: 'https://example.com/a' }, returnType: 'void' } },
          returnType: 'string',
        }),
      ]),
    );
    await tick();
    expect(opened).toEqual([]);
    const activation = errors.filter((e) => /requires user activation/.test(e.error.message));
    expect(activation.length).toBeGreaterThan(0);
    expect(new Set(activation.map((e) => e.error.code))).toEqual(new Set(['EXPRESSION_ERROR']));
  });
});
