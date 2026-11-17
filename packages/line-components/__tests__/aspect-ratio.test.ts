/**
 * `<line-aspect-ratio>` unit tier (spec `0021-aspect-ratio.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`. The component comes from `src/` and `line-core` from its built
 * `dist/` (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the CI unit tier has. happy-dom lays
 * nothing out, resolves no `line-tokens` value and applies no `::slotted()` rule, so sizes, token values and child
 * placement live in the browser tier (`integration/aspect-ratio/aspect-ratio.e2e.ts`). The literal fallbacks of F6
 * (b) let this tier read the computed ratio. The test names `LineAspectRatio` as a value, so its import, and the tag,
 * stay (P8).
 *
 * @module __tests__/aspect-ratio
 */

import { describe, expect, spyOn, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { LineAspectRatio } from '../src/aspect-ratio/index.js';

async function mount(template = html`<line-aspect-ratio><p>a</p></line-aspect-ratio>`): Promise<LineAspectRatio> {
  return fixture<LineAspectRatio>(template);
}

/** Builds an Aspect Ratio from markup, so attribute values reach the element unparsed. */
async function mountMarkup(markup: string): Promise<LineAspectRatio> {
  const host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
  const el = host.querySelector('line-aspect-ratio') as LineAspectRatio;
  await el.updateComplete;
  return el;
}

const RATIOS = [
  ['square', '1 / 1', '1'],
  ['landscape', '4 / 3', '4 / 3'],
  ['portrait', '3 / 4', '3 / 4'],
  ['widescreen', '16 / 9', '16 / 9'],
  ['ultrawide', '18 / 5', '18 / 5'],
  ['golden', '1.618 / 1', '1.618 / 1'],
] as const;

function ratioOf(el: LineAspectRatio): { aspectRatio: string; token: string } {
  const style = getComputedStyle(el);
  return {
    aspectRatio: style.getPropertyValue('aspect-ratio').trim(),
    token: style.getPropertyValue('--line-aspect-ratio-ratio').trim(),
  };
}

describe('<line-aspect-ratio> registration and anatomy', () => {
  test('registers line-aspect-ratio with the LineAspectRatio class', () => {
    expect(customElements.get('line-aspect-ratio')).toBe(LineAspectRatio);
  });

  test('the shadow root holds only a bare default slot (P8)', async () => {
    const el = await mount();
    const children = [...(el.shadowRoot?.children ?? [])];
    expect(children.map((child) => child.localName)).toEqual(['slot']);
    expect(children[0]?.hasAttribute('name')).toBe(false);
    expect(children[0]?.hasAttribute('part')).toBe(false);
    expect(el.shadowRoot?.querySelectorAll('[part]').length).toBe(0);
  });

  test('renders the C8 empty state with no attributes and no children', async () => {
    const el = await mount(html`<line-aspect-ratio></line-aspect-ratio>`);
    expect(el.ratio).toBeUndefined();
    expect(el.getAttributeNames()).toEqual([]);
    expect(el.children.length).toBe(0);
    expect(getComputedStyle(el).display).toBe('grid');
  });
});

describe('<line-aspect-ratio> ratio (F1, F5; D8)', () => {
  test('reflects a set value and leaves no attribute when undefined', async () => {
    const el = await mount();
    for (const [value] of RATIOS) {
      el.ratio = value;
      await el.updateComplete;
      expect(el.getAttribute('ratio')).toBe(value);
    }
    el.ratio = undefined;
    await el.updateComplete;
    expect(el.hasAttribute('ratio')).toBe(false);
    const fresh = await mount();
    expect(fresh.ratio).toBeUndefined();
    expect(fresh.hasAttribute('ratio')).toBe(false);
  });

  test('parses every known attribute value', async () => {
    for (const [value] of RATIOS) {
      const el = await mountMarkup(`<line-aspect-ratio ratio="${value}"></line-aspect-ratio>`);
      expect(el.ratio).toBe(value);
    }
  });

  test('an unknown value reads undefined and the attribute keeps the author value', async () => {
    const el = await mountMarkup('<line-aspect-ratio ratio="16/9"></line-aspect-ratio>');
    expect(el.ratio).toBeUndefined();
    expect(el.getAttribute('ratio')).toBe('16/9');
  });

  test('removing the attribute returns the property to undefined', async () => {
    const el = await mountMarkup('<line-aspect-ratio ratio="golden"></line-aspect-ratio>');
    el.removeAttribute('ratio');
    await el.updateComplete;
    expect(el.ratio).toBeUndefined();
    expect(el.getAttributeNames()).toEqual([]);
  });
});

describe('<line-aspect-ratio> computed ratio through the literal fallbacks (F6 (b); P8)', () => {
  test('no attribute draws a square: display grid, aspect-ratio 1 / 1 and the token 1', async () => {
    const el = await mount();
    expect(getComputedStyle(el).display).toBe('grid');
    expect(ratioOf(el)).toEqual({ aspectRatio: '1 / 1', token: '1' });
  });

  test('an unknown value draws a square', async () => {
    const el = await mountMarkup('<line-aspect-ratio ratio="bogus"></line-aspect-ratio>');
    expect(ratioOf(el)).toEqual({ aspectRatio: '1 / 1', token: '1' });
  });

  for (const [value, aspectRatio, token] of RATIOS) {
    test(`ratio="${value}" computes aspect-ratio ${aspectRatio}`, async () => {
      const el = await mountMarkup(`<line-aspect-ratio ratio="${value}"></line-aspect-ratio>`);
      expect(ratioOf(el)).toEqual({ aspectRatio, token });
    });
  }
});

describe('<line-aspect-ratio> writes nothing on the host and fires nothing (D1, D5, D6)', () => {
  test('writes no role, aria-*, data-*, tabindex or internals.role', async () => {
    const el = await mount();
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.getAttributeNames().filter((name) => name.startsWith('aria-') || name.startsWith('data-'))).toEqual([]);
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null; states: Set<string> };
    expect(internals.role ?? null).toBeNull();
    expect([...internals.states]).toEqual([]);
    expect(el.tabIndex).toBe(-1);
  });

  test('leaves an author role and name unchanged', async () => {
    const el = await mountMarkup(
      '<line-aspect-ratio role="img" aria-label="Revenue by quarter"><img alt=""></line-aspect-ratio>',
    );
    el.ratio = 'golden';
    await el.updateComplete;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Revenue by quarter');
    const internals = Reflect.get(el, INTERNALS) as { role?: string | null };
    expect(internals.role ?? null).toBeNull();
  });

  test('hidden hides the host', async () => {
    const el = await mountMarkup('<line-aspect-ratio hidden ratio="widescreen"></line-aspect-ratio>');
    expect(el.hidden).toBe(true);
    expect(getComputedStyle(el).display).toBe('none');
  });

  test('dispatches no event of any kind', async () => {
    const dispatch = spyOn(LineAspectRatio.prototype, 'dispatchEvent');
    try {
      const el = await mountMarkup('<line-aspect-ratio ratio="square"><p>a</p></line-aspect-ratio>');
      for (const [value] of RATIOS) {
        el.ratio = value;
        await el.updateComplete;
      }
      el.ratio = undefined;
      el.setAttribute('ratio', 'x');
      el.click();
      await el.updateComplete;
      expect(dispatch.mock.calls.filter(([event]) => event.type !== 'click')).toEqual([]);
    } finally {
      dispatch.mockRestore();
    }
  });
});
