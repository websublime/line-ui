/**
 * `<line-chip>` unit tier (spec `0008-chip.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold the
 * custom states. The component comes from `src/` and `line-core` from its built
 * `dist/` through the declared dependency (spec §7.8 rules 1 and 3), so this
 * file needs `bun run build` first, as the CI unit tier has. Keyboard, Tab
 * order, pointer focus, the form and `<fieldset disabled>` behaviour, the
 * computed colours and the accessible name live in the browser tier
 * (`integration/chip/chip.e2e.ts`).
 *
 * @module __tests__/chip
 */

import { describe, expect, mock, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { machine } from '@zag-js/toggle';
import type { CSSResult } from 'lit';
import { LineChip, type LineChipChangeDetail } from '../src/chip/index.js';

/** The field of the preload's fake internals these tests read. */
interface RecordingInternals {
  states: Set<string>;
}

function internals(el: LineChip): RecordingInternals {
  return Reflect.get(el, INTERNALS) as RecordingInternals;
}

function root(el: LineChip): HTMLButtonElement {
  const button = el.shadowRoot?.querySelector<HTMLButtonElement>('[part="root"]');
  if (!button) throw new Error('no [part="root"] button');
  return button;
}

function parts(el: LineChip): (string | null)[] {
  return [...(el.shadowRoot?.querySelectorAll('[part]') ?? [])].map((part) => part.getAttribute('part'));
}

/** Yields one task. The chip flips in a 0 ms task queued during the click dispatch, which runs first. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

async function mount(template = html`<line-chip>In stock</line-chip>`): Promise<LineChip> {
  return fixture<LineChip>(template);
}

/** The component's own sheet: the last entry of `styles`, after the two reset modules. */
function ownCss(): string {
  const styles = LineChip.styles as CSSResult[];
  return (styles.at(-1) as CSSResult).cssText.replace(/\s+/g, ' ');
}

describe('<line-chip> defaults and reflection', () => {
  test('registers line-chip with the LineChip class, which is not form-associated', () => {
    expect(customElements.get('line-chip')).toBe(LineChip);
    expect(Reflect.get(LineChip, 'formAssociated')).toBeUndefined();
  });

  test('takes the common and button reset modules before its own sheet', () => {
    expect((LineChip.styles as CSSResult[]).length).toBe(3);
  });

  test('renders the C8 empty state with no attributes and no content', async () => {
    const el = await mount(html`<line-chip></line-chip>`);
    expect(el.variant).toBe('default');
    expect(el.pressed).toBe(false);
    expect(el.disabled).toBe(false);
    for (const name of ['variant', 'pressed', 'disabled', 'aria-label', 'type']) {
      expect(el.hasAttribute(name)).toBe(false);
    }

    const button = root(el);
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.hasAttribute('disabled')).toBe(false);
    for (const name of ['aria-label', 'aria-description', 'data-scope', 'data-part', 'data-state']) {
      expect(button.hasAttribute(name)).toBe(false);
    }
    expect(parts(el)).toEqual(['root', 'label']);
    expect(button.textContent).toBe('');
  });

  test('reflects every reflecting property to its attribute', async () => {
    const el = await mount();
    el.variant = 'primary';
    el.pressed = true;
    el.disabled = true;
    el.ariaLabel = 'In-stock items';
    el.ariaDescription = 'Shows only items in stock';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('primary');
    expect(el.getAttribute('pressed')).toBe('');
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.getAttribute('aria-label')).toBe('In-stock items');
    expect(el.getAttribute('aria-description')).toBe('Shows only items in stock');
  });

  test('the inner button stays type="button" whatever the host carries, and the class has no form members', async () => {
    const el = await mount(html`<line-chip type="submit" name="stock" value="1">In stock</line-chip>`);
    expect(root(el).getAttribute('type')).toBe('button');
    for (const member of ['type', 'name', 'value', 'form']) expect(member in el).toBe(false);
  });
});

describe('<line-chip> converters', () => {
  test('pressed: absent is false, "false" is false, any other value is true', async () => {
    const el = await mount();
    expect(el.pressed).toBe(false);
    for (const [attribute, value] of [
      ['false', false],
      ['', true],
      ['true', true],
      ['yes', true],
    ] as const) {
      el.setAttribute('pressed', attribute);
      expect(el.pressed).toBe(value);
    }
    el.removeAttribute('pressed');
    expect(el.pressed).toBe(false);
  });

  test('pressed: reflects as an empty attribute when true and as none when false', async () => {
    const el = await mount();
    el.pressed = true;
    await el.updateComplete;
    expect(el.getAttribute('pressed')).toBe('');
    el.pressed = false;
    await el.updateComplete;
    expect(el.hasAttribute('pressed')).toBe(false);
  });

  test('pressed: an author pressed="false" stays as written until the property changes', async () => {
    const el = await mount(html`<line-chip pressed="false">In stock</line-chip>`);
    expect(el.pressed).toBe(false);
    expect(el.getAttribute('pressed')).toBe('false');
    expect(root(el).getAttribute('aria-pressed')).toBe('false');
  });

  test('pressed: undefined from code behaves as off', async () => {
    const el = await mount(html`<line-chip pressed>In stock</line-chip>`);
    Reflect.set(el, 'pressed', undefined);
    await el.updateComplete;
    expect(root(el).getAttribute('aria-pressed')).toBe('false');
    expect(el.hasAttribute('data-pressed')).toBe(false);
    expect(el.hasAttribute('pressed')).toBe(false);
  });

  test('variant: an unknown value behaves as default and the attribute keeps what the author wrote', async () => {
    const el = await mount(html`<line-chip variant="primary">In stock</line-chip>`);
    expect(el.variant).toBe('primary');
    el.setAttribute('variant', 'loud');
    await el.updateComplete;
    expect(el.variant).toBe('default');
    expect(el.getAttribute('variant')).toBe('loud');
  });

  test('variant: an unknown value in the initial markup behaves as default and keeps the author attribute', async () => {
    const el = await mount(html`<line-chip variant="borderless">In stock</line-chip>`);
    expect(el.variant).toBe('default');
    expect(el.getAttribute('variant')).toBe('borderless');
  });

  test('removing variant restores the default and leaves no attribute', async () => {
    const el = await mount(html`<line-chip variant="primary">In stock</line-chip>`);
    el.removeAttribute('variant');
    await el.updateComplete;
    expect(el.variant).toBe('default');
    expect(el.hasAttribute('variant')).toBe(false);
  });
});

describe('<line-chip> state reflection', () => {
  test('pressed and disabled reflect as data-* and :state()', async () => {
    const el = await mount(html`<line-chip pressed disabled>In stock</line-chip>`);
    const { states } = internals(el);
    for (const name of ['pressed', 'disabled']) {
      expect(el.hasAttribute(`data-${name}`)).toBe(true);
      expect(states.has(name)).toBe(true);
    }
    el.pressed = false;
    el.disabled = false;
    await el.updateComplete;
    for (const name of ['pressed', 'disabled']) {
      expect(el.hasAttribute(`data-${name}`)).toBe(false);
      expect(states.has(name)).toBe(false);
    }
  });

  test('focus-visible follows whether the focused inner button matches :focus-visible, and clears on blur', async () => {
    // happy-dom does not match :focus-visible inside a shadow root, so the button reports it here; the browser tier
    // checks keyboard against pointer focus in three engines.
    const el = await mount();
    const button = root(el);
    let visible = true;
    button.matches = (selector: string) => selector === ':focus-visible' && visible;
    button.dispatchEvent(new FocusEvent('focus'));
    await el.updateComplete;
    expect(el.hasAttribute('data-focus-visible')).toBe(true);
    expect(internals(el).states.has('focus-visible')).toBe(true);
    button.dispatchEvent(new FocusEvent('blur'));
    await el.updateComplete;
    expect(el.hasAttribute('data-focus-visible')).toBe(false);
    expect(internals(el).states.has('focus-visible')).toBe(false);
    visible = false;
    button.dispatchEvent(new FocusEvent('focus'));
    await el.updateComplete;
    expect(el.hasAttribute('data-focus-visible')).toBe(false);
  });
});

describe('<line-chip> ARIA on the inner button', () => {
  test('aria-pressed follows pressed, and disabled is native', async () => {
    const el = await mount();
    el.pressed = true;
    el.disabled = true;
    await el.updateComplete;
    expect(root(el).getAttribute('aria-pressed')).toBe('true');
    expect(root(el).disabled).toBe(true);
    expect(root(el).hasAttribute('aria-disabled')).toBe(false);
    el.disabled = false;
    await el.updateComplete;
    expect(root(el).disabled).toBe(false);
  });

  test('copies aria-label and aria-description from the host', async () => {
    const el = await mount(
      html`<line-chip aria-label="In-stock items" aria-description="Shows only items in stock">In stock</line-chip>`,
    );
    expect(root(el).getAttribute('aria-label')).toBe('In-stock items');
    expect(root(el).getAttribute('aria-description')).toBe('Shows only items in stock');
    el.removeAttribute('aria-label');
    el.removeAttribute('aria-description');
    await el.updateComplete;
    expect(root(el).hasAttribute('aria-label')).toBe(false);
    expect(root(el).hasAttribute('aria-description')).toBe(false);
  });
});

describe('<line-chip> parts and slots', () => {
  const FULL = html`<line-chip
    ><span slot="indicator">✓</span><span slot="prefix">★</span>Unread<span slot="suffix">12</span></line-chip
  >`;

  test('the indicator part and slot render only while pressed', async () => {
    const el = await mount(FULL);
    expect(parts(el)).toEqual(['root', 'label']);
    expect(el.shadowRoot?.querySelector('slot[name="indicator"]')).toBeNull();
    el.pressed = true;
    await el.updateComplete;
    expect(parts(el)).toEqual(['root', 'indicator', 'label']);
    const slot = el.shadowRoot?.querySelector<HTMLSlotElement>('[part="indicator"] > slot[name="indicator"]');
    expect(slot?.assignedElements().map((element) => element.textContent)).toEqual(['✓']);
    el.pressed = false;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="indicator"]')).toBeNull();
  });

  test('the indicator, prefix, default and suffix slots sit in that tree order, the default inside the label part', async () => {
    const el = await mount(FULL);
    el.pressed = true;
    await el.updateComplete;
    const slots = [...root(el).querySelectorAll('slot')];
    expect(slots.map((slot) => slot.name)).toEqual(['indicator', 'prefix', '', 'suffix']);
    expect(slots[2]?.parentElement?.getAttribute('part')).toBe('label');
    expect(
      slots.map((slot) =>
        slot
          .assignedNodes()
          .map((node) => node.textContent)
          .join(''),
      ),
    ).toEqual(['✓', '★', 'Unread', '12']);
  });
});

describe('<line-chip> tokens', () => {
  test(':host declares the token defaults, with the default-off colours', () => {
    const css = ownCss();
    for (const declaration of [
      '--line-chip-radius: var(--line-radius-round);',
      '--line-chip-bg: var(--line-gray-bg);',
      '--line-chip-color: var(--line-gray-text);',
      '--line-chip-border-color: var(--line-gray-border);',
      '--line-chip-border-width: var(--line-border-1);',
      '--line-chip-height: var(--line-size-6);',
      '--line-chip-padding-inline: var(--line-size-3);',
      '--line-chip-gap: var(--line-size-1);',
      '--line-chip-font-size: var(--line-font-size-1);',
      '--line-chip-font-weight: var(--line-font-weight-5);',
      '--line-chip-focus-ring: var(--line-focus-ring, 2px solid currentColor);',
    ]) {
      expect(css).toContain(declaration);
    }
  });

  test('the pressed, primary and pressed primary rules redeclare only the three colour tokens', () => {
    const css = ownCss();
    expect(css).toContain(
      ':host([data-pressed]) { --line-chip-bg: var(--line-accent-bg); --line-chip-color: var(--line-accent-text); --line-chip-border-color: var(--line-accent-border); }',
    );
    expect(css).toContain(
      ":host([variant='primary']) { --line-chip-bg: transparent; --line-chip-color: var(--line-accent-text); --line-chip-border-color: var(--line-accent-border); }",
    );
    expect(css).toContain(
      ":host([variant='primary'][data-pressed]) { --line-chip-bg: var(--line-accent-solid); --line-chip-color: var(--line-accent-contrast); --line-chip-border-color: var(--line-accent-solid); }",
    );
  });

  test('root draws its border with longhands, fills its host and takes the focus ring on data-focus-visible', () => {
    const css = ownCss();
    for (const declaration of [
      'border-style: solid;',
      'border-width: var(--line-chip-border-width);',
      'border-color: var(--line-chip-border-color);',
      'inline-size: 100%;',
      'min-block-size: var(--line-chip-height);',
    ]) {
      expect(css).toContain(declaration);
    }
    expect(css).not.toMatch(/border: /);
    expect(css).toContain(":host([data-focus-visible]) [part='root'] { outline: var(--line-chip-focus-ring); }");
  });
});

describe('<line-chip> activation and line-change', () => {
  test('fires line-change once per activation, after pressed changed, bubbling and not composed', async () => {
    const el = await mount();
    const seen: { detail: LineChipChangeDetail; pressed: boolean; bubbles: boolean; composed: boolean }[] = [];
    const record = (event: Event) => {
      const change = event as CustomEvent<LineChipChangeDetail>;
      seen.push({ detail: change.detail, pressed: el.pressed, bubbles: change.bubbles, composed: change.composed });
    };
    document.addEventListener('line-change', record);
    try {
      el.click();
      await nextTask();
      expect(el.pressed).toBe(true);
      root(el).click();
      await nextTask();
      expect(el.pressed).toBe(false);
    } finally {
      document.removeEventListener('line-change', record);
    }
    expect(seen).toEqual([
      { detail: { value: true }, pressed: true, bubbles: true, composed: false },
      { detail: { value: false }, pressed: false, bubbles: true, composed: false },
    ]);
  });

  test('never fires line-change on a property or attribute change', async () => {
    const el = await mount();
    const listener = mock();
    el.addEventListener('line-change', listener);
    el.pressed = true;
    await el.updateComplete;
    el.setAttribute('pressed', 'false');
    await el.updateComplete;
    el.removeAttribute('pressed');
    await nextTask();
    expect(listener).not.toHaveBeenCalled();
    expect(root(el).getAttribute('aria-pressed')).toBe('false');
  });

  test('a click listener that calls preventDefault cancels the flip', async () => {
    const el = await mount();
    const listener = mock();
    el.addEventListener('line-change', listener);
    el.addEventListener('click', (event) => event.preventDefault());
    el.click();
    await nextTask();
    expect(el.pressed).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  test('while disabled, no click reaches host or ancestor listeners and nothing flips, host.click() included', async () => {
    const wrapper = await fixture<HTMLDivElement>(html`<div><line-chip disabled>In stock</line-chip></div>`);
    const el = wrapper.querySelector('line-chip') as LineChip;
    const clicks = mock();
    const changes = mock();
    el.addEventListener('click', clicks);
    wrapper.addEventListener('click', clicks);
    el.addEventListener('line-change', changes);
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
    await nextTask();
    expect(clicks).not.toHaveBeenCalled();
    expect(changes).not.toHaveBeenCalled();
    expect(el.pressed).toBe(false);
  });

  test('a chip disabled after the click and before the flip stays as it was', async () => {
    const el = await mount();
    const listener = mock();
    el.addEventListener('line-change', listener);
    el.click();
    el.disabled = true;
    await nextTask();
    expect(el.pressed).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('<line-chip> machine-failure fallback', () => {
  test('renders from its own props and still flips and fires line-change when the machine fails to start', async () => {
    const { initialState } = machine;
    const consoleError = console.error;
    console.error = mock();
    machine.initialState = () => {
      throw new Error('machine start failure');
    };
    try {
      const off = await mount(html`<line-chip disabled pressed aria-label="In-stock items">In stock</line-chip>`);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(root(off).disabled).toBe(true);
      expect(root(off).getAttribute('aria-pressed')).toBe('true');
      expect(root(off).getAttribute('aria-label')).toBe('In-stock items');
      expect(parts(off)).toEqual(['root', 'indicator', 'label']);
      expect(off.hasAttribute('data-pressed')).toBe(true);
      expect(off.hasAttribute('data-disabled')).toBe(true);

      const el = await mount();
      const values: boolean[] = [];
      el.addEventListener('line-change', (event) =>
        values.push((event as CustomEvent<LineChipChangeDetail>).detail.value),
      );
      el.click();
      await nextTask();
      await el.updateComplete;
      expect(el.pressed).toBe(true);
      expect(root(el).getAttribute('aria-pressed')).toBe('true');
      expect(values).toEqual([true]);
    } finally {
      machine.initialState = initialState;
      console.error = consoleError;
    }
  });
});
