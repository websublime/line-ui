/**
 * `<line-spinner>` unit tier (spec `0022-spinner.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from `src/` and `line-core` from its built
 * `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. happy-dom runs
 * no animation, lays nothing out and has no accessibility tree (P9), so motion, sizes in pixels, forced colors and the
 * tree live in the browser tier (`integration/spinner/spinner.e2e.ts`). The literal fallbacks of D6 let this tier read
 * the computed tokens.
 *
 * @module __tests__/spinner
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { LineSpinner } from '../src/spinner/index.js';

interface Semantics {
  role: string | null;
  ariaLabel: string | null;
  ariaHidden: string | null;
}

async function mount(template = html`<line-spinner></line-spinner>`): Promise<LineSpinner> {
  return fixture<LineSpinner>(template);
}

/** Builds a Spinner from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineSpinner> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-spinner') as LineSpinner;
  await el.updateComplete;
  return el;
}

function semantics(el: LineSpinner): Semantics {
  const internals = Reflect.get(el, INTERNALS) as Partial<Semantics>;
  return {
    role: internals.role ?? null,
    ariaLabel: internals.ariaLabel ?? null,
    ariaHidden: internals.ariaHidden ?? null,
  };
}

function token(el: LineSpinner, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

const HIDDEN: Semantics = { role: null, ariaLabel: null, ariaHidden: 'true' };

const SIZES = [
  ['1', '1rem'],
  ['2', '1.25rem'],
  ['3', '1.5rem'],
  ['4', '1.75rem'],
  ['5', '2rem'],
  ['6', '3rem'],
] as const;

const SPEEDS = [
  ['slow', '2s'],
  ['normal', '1s'],
  ['fast', '0.75s'],
] as const;

describe('<line-spinner> registration and anatomy', () => {
  test('registers line-spinner with the LineSpinner class', () => {
    expect(customElements.get('line-spinner')).toBe(LineSpinner);
  });

  test('the shadow root holds one <span part="root"> and nothing else (D2)', async () => {
    const el = await mount();
    const children = [...(el.shadowRoot?.children ?? [])];
    expect(children.map((child) => `${child.localName}[part=${child.getAttribute('part')}]`)).toEqual([
      'span[part=root]',
    ]);
    expect(children[0]?.childNodes.length).toBe(0);
    expect(el.shadowRoot?.querySelectorAll('slot').length).toBe(0);
  });

  test('renders the C8 empty state with no attributes', async () => {
    const el = await mount();
    expect(el.label).toBeUndefined();
    expect(el.size).toBeUndefined();
    expect(el.speed).toBeUndefined();
    expect(el.getAttributeNames()).toEqual([]);
    expect(getComputedStyle(el).display).toBe('inline-block');
  });
});

describe('<line-spinner> semantics through ElementInternals (F1, F2; D9)', () => {
  test('with no name the spinner has no role and is hidden', async () => {
    expect(semantics(await mount())).toEqual(HIDDEN);
  });

  test('label names a progressbar through internals.ariaLabel', async () => {
    const el = await mount(html`<line-spinner label="Loading"></line-spinner>`);
    expect(semantics(el)).toEqual({ role: 'progressbar', ariaLabel: 'Loading', ariaHidden: null });
  });

  test('a host aria-label makes a progressbar and leaves internals.ariaLabel to label', async () => {
    const el = await mountMarkup('<line-spinner aria-label="Saving"></line-spinner>');
    expect(semantics(el)).toEqual({ role: 'progressbar', ariaLabel: null, ariaHidden: null });
    const both = await mountMarkup('<line-spinner label="Loading" aria-label="Saving"></line-spinner>');
    expect(semantics(both)).toEqual({ role: 'progressbar', ariaLabel: 'Loading', ariaHidden: null });
  });

  test('a host aria-labelledby makes a progressbar', async () => {
    const el = await mountMarkup('<line-spinner aria-labelledby="status"></line-spinner>');
    expect(semantics(el)).toEqual({ role: 'progressbar', ariaLabel: null, ariaHidden: null });
  });

  test('a blank label, aria-label or aria-labelledby counts as none (P1 N5)', async () => {
    expect(semantics(await mountMarkup('<line-spinner label="  "></line-spinner>'))).toEqual(HIDDEN);
    expect(semantics(await mountMarkup('<line-spinner aria-label=" "></line-spinner>'))).toEqual(HIDDEN);
    expect(semantics(await mountMarkup('<line-spinner aria-labelledby=""></line-spinner>'))).toEqual(HIDDEN);
  });

  test('a label changed after render follows, and a cleared one hides the spinner again (P3)', async () => {
    const el = await mount();
    el.label = 'Loading';
    await el.updateComplete;
    expect(semantics(el)).toEqual({ role: 'progressbar', ariaLabel: 'Loading', ariaHidden: null });
    el.label = 'Almost done';
    await el.updateComplete;
    expect(semantics(el).ariaLabel).toBe('Almost done');
    el.label = '';
    await el.updateComplete;
    expect(semantics(el)).toEqual(HIDDEN);
  });

  test('a host aria-label added after the first render names the spinner, and removing it hides it again', async () => {
    const el = await mount();
    el.setAttribute('aria-label', 'Saving');
    expect(semantics(el)).toEqual({ role: 'progressbar', ariaLabel: null, ariaHidden: null });
    el.removeAttribute('aria-label');
    expect(semantics(el)).toEqual(HIDDEN);
  });

  test('a host aria-labelledby added after the first render names the spinner, and removing it hides it again', async () => {
    const el = await mount();
    el.setAttribute('aria-labelledby', 'status');
    expect(semantics(el)).toEqual({ role: 'progressbar', ariaLabel: null, ariaHidden: null });
    el.removeAttribute('aria-labelledby');
    expect(semantics(el)).toEqual(HIDDEN);
  });

  test('a named spinner whose host name goes away keeps its label', async () => {
    const el = await mountMarkup('<line-spinner label="Loading" aria-label="Saving"></line-spinner>');
    el.removeAttribute('aria-label');
    expect(semantics(el)).toEqual({ role: 'progressbar', ariaLabel: 'Loading', ariaHidden: null });
  });

  test('label does not reflect and no role or aria-* attribute is written on the host', async () => {
    const el = await mount();
    el.label = 'Loading';
    el.size = '3';
    el.speed = 'fast';
    await el.updateComplete;
    expect(el.getAttributeNames().sort()).toEqual(['size', 'speed']);
    expect(el.tabIndex).toBe(-1);
  });
});

describe('<line-spinner> size and speed (F6; D8)', () => {
  test('reflect a set value and leave no attribute when undefined', async () => {
    const el = await mount();
    for (const [value] of SIZES) {
      el.size = value;
      await el.updateComplete;
      expect(el.getAttribute('size')).toBe(value);
    }
    for (const [value] of SPEEDS) {
      el.speed = value;
      await el.updateComplete;
      expect(el.getAttribute('speed')).toBe(value);
    }
    el.size = undefined;
    el.speed = undefined;
    await el.updateComplete;
    expect(el.hasAttribute('size')).toBe(false);
    expect(el.hasAttribute('speed')).toBe(false);
  });

  test('parse every known attribute value', async () => {
    for (const [value] of SIZES) {
      expect((await mountMarkup(`<line-spinner size="${value}"></line-spinner>`)).size).toBe(value);
    }
    for (const [value] of SPEEDS) {
      expect((await mountMarkup(`<line-spinner speed="${value}"></line-spinner>`)).speed).toBe(value);
    }
  });

  test('an unknown value reads undefined and the attribute keeps the author value', async () => {
    const el = await mountMarkup('<line-spinner size="xl" speed="warp"></line-spinner>');
    expect(el.size).toBeUndefined();
    expect(el.speed).toBeUndefined();
    expect(el.getAttribute('size')).toBe('xl');
    expect(el.getAttribute('speed')).toBe('warp');
  });

  test('removing the attribute returns the property to undefined', async () => {
    const el = await mount();
    el.size = '2';
    el.speed = 'slow';
    await el.updateComplete;
    el.removeAttribute('size');
    el.removeAttribute('speed');
    await el.updateComplete;
    expect(el.size).toBeUndefined();
    expect(el.speed).toBeUndefined();
    expect(el.getAttributeNames()).toEqual([]);
  });
});

describe('<line-spinner> computed tokens through the literal fallbacks (D6; P9)', () => {
  test('no attribute computes --line-spinner-size 1em and --line-spinner-duration 1s', async () => {
    const el = await mount();
    expect(token(el, '--line-spinner-size')).toBe('1em');
    expect(token(el, '--line-spinner-duration')).toBe('1s');
  });

  test('an unknown size or speed draws the default', async () => {
    const el = await mountMarkup('<line-spinner size="xl" speed="warp"></line-spinner>');
    expect(token(el, '--line-spinner-size')).toBe('1em');
    expect(token(el, '--line-spinner-duration')).toBe('1s');
  });

  for (const [value, size] of SIZES) {
    test(`size="${value}" computes --line-spinner-size ${size}`, async () => {
      expect(token(await mountMarkup(`<line-spinner size="${value}"></line-spinner>`), '--line-spinner-size')).toBe(
        size,
      );
    });
  }

  for (const [value, duration] of SPEEDS) {
    test(`speed="${value}" computes --line-spinner-duration ${duration}`, async () => {
      expect(
        token(await mountMarkup(`<line-spinner speed="${value}"></line-spinner>`), '--line-spinner-duration'),
      ).toBe(duration);
    });
  }

  test('hidden hides the host', async () => {
    const el = await mountMarkup('<line-spinner hidden label="Loading" size="3"></line-spinner>');
    expect(el.hidden).toBe(true);
    expect(getComputedStyle(el).display).toBe('none');
  });
});

describe('<line-spinner> fires nothing (D1)', () => {
  test('dispatches no event of any kind while every prop is set and changed', async () => {
    const dispatch = spyOn(LineSpinner.prototype, 'dispatchEvent');
    try {
      const el = await mountMarkup('<line-spinner label="Loading" size="1" speed="slow"></line-spinner>');
      for (const [value] of SIZES) {
        el.size = value;
        await el.updateComplete;
      }
      for (const [value] of SPEEDS) {
        el.speed = value;
        await el.updateComplete;
      }
      el.label = 'Almost done';
      el.setAttribute('aria-label', 'Saving');
      el.removeAttribute('aria-label');
      el.size = undefined;
      el.speed = undefined;
      el.label = undefined;
      el.click();
      await el.updateComplete;
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});
