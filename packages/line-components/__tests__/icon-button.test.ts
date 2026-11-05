/**
 * `<line-icon-button>` unit tier (spec `0003-icon-button.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals hold the
 * custom states. The component comes from `src/` and `line-core` from its built
 * `dist/` through the declared dependency (spec §7.8 rules 1 and 3), so this
 * file needs `bun run build` first, as the CI unit tier has. Keyboard,
 * focus-visible, pointer presses, the form and `<fieldset disabled>` behaviour
 * and the accessible name live in the browser tier
 * (`integration/icon-button/icon-button.e2e.ts`).
 *
 * @module __tests__/icon-button
 */

import { describe, expect, mock, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import type { CSSResult } from 'lit';
import { LineIconButton } from '../src/icon-button/index.js';
import { buttonMachine } from '../src/shared/button-machine.js';

/** The field of the preload's fake internals these tests read. */
interface RecordingInternals {
  states: Set<string>;
}

function internals(el: LineIconButton): RecordingInternals {
  return Reflect.get(el, INTERNALS) as RecordingInternals;
}

function root(el: LineIconButton): HTMLButtonElement {
  const button = el.shadowRoot?.querySelector<HTMLButtonElement>('[part="root"]');
  if (!button) throw new Error('no [part="root"] button');
  return button;
}

/** Yields one task. The component activates in a 0 ms task queued during the click dispatch, which runs first. */
function nextTask(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve);
  return promise;
}

/** Machine notifications reach the host after a microtask, so wait a task and then the host update. */
async function settle(el: LineIconButton): Promise<void> {
  await nextTask();
  await el.updateComplete;
}

const ICON = html`<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M2 2h12v12H2z" /></svg>`;

async function mount(
  template = html`<line-icon-button aria-label="Settings">${ICON}</line-icon-button>`,
): Promise<LineIconButton> {
  return fixture<LineIconButton>(template);
}

/** The component's own sheet: the last entry of `styles`, after the two reset modules. */
function ownCss(): string {
  const styles = LineIconButton.styles as CSSResult[];
  return (styles.at(-1) as CSSResult).cssText.replace(/\s+/g, ' ');
}

describe('<line-icon-button> defaults and reflection', () => {
  test('registers line-icon-button with the LineIconButton class, which is not form-associated', () => {
    expect(customElements.get('line-icon-button')).toBe(LineIconButton);
    expect(Reflect.get(LineIconButton, 'formAssociated')).toBeUndefined();
  });

  test('renders the C8 empty state with no attributes and no content', async () => {
    const el = await mount(html`<line-icon-button></line-icon-button>`);
    expect(el.variant).toBe('default');
    expect(el.disabled).toBe(false);
    expect(el.loading).toBe(false);
    expect(el.pressed).toBeUndefined();
    for (const name of ['variant', 'disabled', 'loading', 'pressed', 'aria-label', 'type']) {
      expect(el.hasAttribute(name)).toBe(false);
    }

    const button = root(el);
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('disabled')).toBe(false);
    for (const name of ['aria-pressed', 'aria-disabled', 'aria-label', 'aria-description']) {
      expect(button.hasAttribute(name)).toBe(false);
    }
    expect(button.querySelector('[part="icon"] > slot:not([name])')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('[part="loading"]')).toBeNull();
    expect(el.shadowRoot?.querySelector('slot[name="loading"]')).toBeNull();
  });

  test('reflects every reflecting property to its attribute', async () => {
    const el = await mount();
    el.variant = 'primary';
    el.disabled = true;
    el.loading = true;
    el.pressed = true;
    el.ariaLabel = 'Preferences';
    el.ariaDescription = 'Opens the settings';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('primary');
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.hasAttribute('loading')).toBe(true);
    expect(el.getAttribute('pressed')).toBe('true');
    expect(el.getAttribute('aria-label')).toBe('Preferences');
    expect(el.getAttribute('aria-description')).toBe('Opens the settings');
    expect(root(el).getAttribute('aria-label')).toBe('Preferences');
    expect(root(el).getAttribute('aria-description')).toBe('Opens the settings');
  });

  test('the inner button stays type="button" whatever the host carries', async () => {
    const el = await mount(html`<line-icon-button type="submit" aria-label="Save">${ICON}</line-icon-button>`);
    expect(root(el).getAttribute('type')).toBe('button');
    expect('type' in el).toBe(false);
  });
});

describe('<line-icon-button> converters', () => {
  test('variant: an unknown value behaves as default and the attribute keeps what the author wrote', async () => {
    const el = await mount(html`<line-icon-button variant="borderless" aria-label="Close">${ICON}</line-icon-button>`);
    expect(el.variant).toBe('borderless');
    el.setAttribute('variant', 'loud');
    await el.updateComplete;
    expect(el.variant).toBe('default');
    expect(el.getAttribute('variant')).toBe('loud');
  });

  test('variant: an unknown value in the initial markup behaves as default and keeps the author attribute', async () => {
    const el = await mount(html`<line-icon-button variant="foo" aria-label="Close">${ICON}</line-icon-button>`);
    expect(el.variant).toBe('default');
    expect(el.getAttribute('variant')).toBe('foo');
  });

  test('removing variant restores the default and leaves no attribute', async () => {
    const el = await mount(html`<line-icon-button variant="primary" aria-label="Add">${ICON}</line-icon-button>`);
    el.removeAttribute('variant');
    await el.updateComplete;
    expect(el.variant).toBe('default');
    expect(el.hasAttribute('variant')).toBe(false);
  });

  test('pressed: absent is undefined, "false" is false, any other value is true', async () => {
    const el = await mount();
    expect(el.pressed).toBeUndefined();
    for (const [attribute, value] of [
      ['false', false],
      ['true', true],
      ['', true],
      ['yes', true],
    ] as const) {
      el.setAttribute('pressed', attribute);
      expect(el.pressed).toBe(value);
    }
    el.removeAttribute('pressed');
    expect(el.pressed).toBeUndefined();
  });

  test('pressed: reflects as "true" or "false" and removes the attribute when undefined', async () => {
    const el = await mount();
    el.pressed = true;
    await el.updateComplete;
    expect(el.getAttribute('pressed')).toBe('true');
    el.pressed = false;
    await el.updateComplete;
    expect(el.getAttribute('pressed')).toBe('false');
    el.pressed = undefined;
    await el.updateComplete;
    expect(el.hasAttribute('pressed')).toBe(false);
  });
});

describe('<line-icon-button> state reflection', () => {
  test('pressed, loading and disabled reflect as data-* and :state()', async () => {
    const el = await mount(
      html`<line-icon-button pressed="true" loading disabled aria-label="Mute">${ICON}</line-icon-button>`,
    );
    const { states } = internals(el);
    for (const name of ['pressed', 'loading', 'disabled']) {
      expect(el.hasAttribute(`data-${name}`)).toBe(true);
      expect(states.has(name)).toBe(true);
    }
    el.pressed = false;
    el.loading = false;
    el.disabled = false;
    await el.updateComplete;
    for (const name of ['pressed', 'loading', 'disabled']) {
      expect(el.hasAttribute(`data-${name}`)).toBe(false);
      expect(states.has(name)).toBe(false);
    }
  });

  test('a press reflects active and its end returns to idle', async () => {
    const el = await mount();
    root(el).dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, composed: true }));
    await settle(el);
    expect(el.hasAttribute('data-active')).toBe(true);
    expect(internals(el).states.has('active')).toBe(true);

    window.dispatchEvent(new PointerEvent('pointerup', { button: 0 }));
    await settle(el);
    expect(el.hasAttribute('data-active')).toBe(false);
    expect(internals(el).states.has('active')).toBe(false);
  });

  test('Enter and Space enter active on keydown and leave it on keyup', async () => {
    const el = await mount();
    for (const key of ['Enter', ' ']) {
      root(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
      await settle(el);
      expect(el.hasAttribute('data-active')).toBe(true);
      root(el).dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, composed: true }));
      await settle(el);
      expect(el.hasAttribute('data-active')).toBe(false);
    }
  });

  test('loading or disabled turning true cancels a running press', async () => {
    const el = await mount();
    for (const block of ['loading', 'disabled'] as const) {
      root(el).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
      await settle(el);
      expect(el.hasAttribute('data-active')).toBe(true);
      el[block] = true;
      await settle(el);
      expect(el.hasAttribute('data-active')).toBe(false);
      el[block] = false;
      await settle(el);
    }
  });

  test('a press does not start while loading or disabled', async () => {
    for (const template of [
      html`<line-icon-button loading aria-label="Refresh">${ICON}</line-icon-button>`,
      html`<line-icon-button disabled aria-label="Refresh">${ICON}</line-icon-button>`,
    ]) {
      const el = await mount(template);
      root(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      root(el).dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, composed: true }));
      await settle(el);
      expect(el.hasAttribute('data-active')).toBe(false);
    }
  });
});

describe('<line-icon-button> ARIA on the inner button', () => {
  test('copies aria-label and aria-description from the host', async () => {
    const el = await mount(
      html`<line-icon-button aria-label="Settings" aria-description="Opens the settings">${ICON}</line-icon-button>`,
    );
    expect(root(el).getAttribute('aria-label')).toBe('Settings');
    expect(root(el).getAttribute('aria-description')).toBe('Opens the settings');
    expect(el.getAttribute('aria-label')).toBe('Settings');
    el.setAttribute('aria-label', 'Preferences');
    el.removeAttribute('aria-description');
    await el.updateComplete;
    expect(root(el).getAttribute('aria-label')).toBe('Preferences');
    expect(root(el).hasAttribute('aria-description')).toBe(false);
    el.removeAttribute('aria-label');
    await el.updateComplete;
    expect(root(el).hasAttribute('aria-label')).toBe(false);
  });

  test('aria-pressed follows pressed on a toggle and is absent otherwise', async () => {
    const el = await mount(html`<line-icon-button pressed="false" aria-label="Mute">${ICON}</line-icon-button>`);
    expect(root(el).getAttribute('aria-pressed')).toBe('false');
    el.pressed = true;
    await el.updateComplete;
    expect(root(el).getAttribute('aria-pressed')).toBe('true');
    el.pressed = undefined;
    await el.updateComplete;
    expect(root(el).hasAttribute('aria-pressed')).toBe(false);
  });

  test('loading sets aria-disabled, keeps the button enabled and renders the loading part and slot', async () => {
    const el = await mount(
      html`<line-icon-button loading aria-label="Refreshing">${ICON}<span slot="loading">…</span></line-icon-button>`,
    );
    expect(root(el).getAttribute('aria-disabled')).toBe('true');
    expect(root(el).disabled).toBe(false);
    expect(el.shadowRoot?.querySelector('[part="loading"] > slot[name="loading"]')).not.toBeNull();
    el.loading = false;
    await el.updateComplete;
    expect(root(el).hasAttribute('aria-disabled')).toBe(false);
    expect(el.shadowRoot?.querySelector('[part="loading"]')).toBeNull();
  });

  test('disabled sets native disabled and no aria-disabled, even while loading', async () => {
    const el = await mount(html`<line-icon-button disabled loading aria-label="Refresh">${ICON}</line-icon-button>`);
    expect(root(el).disabled).toBe(true);
    expect(root(el).hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('<line-icon-button> parts, slots and tokens', () => {
  test('the icon part wraps the default slot, which takes the icon', async () => {
    const el = await mount();
    const slot = el.shadowRoot?.querySelector<HTMLSlotElement>('[part="root"] > [part="icon"] > slot:not([name])');
    expect(slot).not.toBeNull();
    expect(slot?.assignedElements().map((element) => element.localName)).toEqual(['svg']);
    expect([...(el.shadowRoot?.querySelectorAll('[part]') ?? [])].map((part) => part.getAttribute('part'))).toEqual([
      'root',
      'icon',
    ]);
  });

  test('the loading part wraps the loading slot after the icon part', async () => {
    const el = await mount(
      html`<line-icon-button loading aria-label="Refreshing">${ICON}<span slot="loading">…</span></line-icon-button>`,
    );
    expect([...(el.shadowRoot?.querySelectorAll('[part]') ?? [])].map((part) => part.getAttribute('part'))).toEqual([
      'root',
      'icon',
      'loading',
    ]);
    const slot = el.shadowRoot?.querySelector<HTMLSlotElement>('[part="loading"] > slot[name="loading"]');
    expect(slot?.assignedElements().map((element) => element.textContent)).toEqual(['…']);
  });

  test(':host declares the token defaults, and each variant redeclares only the two colour tokens', () => {
    const css = ownCss();
    for (const declaration of [
      '--line-icon-button-radius: var(--line-radius-2);',
      '--line-icon-button-bg: var(--line-gray-bg);',
      '--line-icon-button-color: var(--line-gray-text);',
      '--line-icon-button-size: var(--line-size-7);',
      '--line-icon-button-font-size: var(--line-font-size-1);',
      '--line-icon-button-focus-ring: var(--line-focus-ring, 2px solid currentColor);',
    ]) {
      expect(css).toContain(declaration);
    }
    expect(css).toContain(
      ":host([variant='primary']) { --line-icon-button-bg: var(--line-accent-solid); --line-icon-button-color: var(--line-accent-contrast); }",
    );
    expect(css).toContain(
      ":host([variant='borderless']) { --line-icon-button-bg: transparent; --line-icon-button-color: var(--line-accent-text); }",
    );
  });

  test('the root is square through --line-icon-button-size, with no inline padding and flex slot wrappers', () => {
    const css = ownCss();
    expect(css).toContain('min-inline-size: var(--line-icon-button-size);');
    expect(css).toContain('min-block-size: var(--line-icon-button-size);');
    expect(css).toContain('padding-inline: 0;');
    expect(css).toContain("[part='icon'], [part='loading'] { display: inline-flex; }");
    expect(css).toContain(":host([data-focus-visible]) [part='root'] { outline: var(--line-icon-button-focus-ring); }");
  });
});

describe('<line-icon-button> activation and line-change', () => {
  test('fires line-change once per toggle activation with the new state', async () => {
    const el = await mount(html`<line-icon-button pressed="false" aria-label="Mute">${ICON}</line-icon-button>`);
    const seen: CustomEvent<{ value: boolean }>[] = [];
    const record = (event: Event) => seen.push(event as CustomEvent<{ value: boolean }>);
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

    expect(seen.map((event) => event.detail)).toEqual([{ value: true }, { value: false }]);
    expect(seen.every((event) => event.target === el && event.bubbles && !event.composed)).toBe(true);
  });

  test('never fires line-change on a property or attribute change, or on a plain icon button', async () => {
    const el = await mount(html`<line-icon-button pressed="false" aria-label="Mute">${ICON}</line-icon-button>`);
    const listener = mock();
    el.addEventListener('line-change', listener);
    el.pressed = true;
    await el.updateComplete;
    el.setAttribute('pressed', 'false');
    await el.updateComplete;

    const plain = await mount();
    plain.addEventListener('line-change', listener);
    plain.click();
    await nextTask();
    expect(plain.pressed).toBeUndefined();
    expect(listener).not.toHaveBeenCalled();
  });

  test('a click listener that calls preventDefault cancels the toggle', async () => {
    const el = await mount(html`<line-icon-button pressed="false" aria-label="Mute">${ICON}</line-icon-button>`);
    const listener = mock();
    el.addEventListener('line-change', listener);
    el.addEventListener('click', (event) => event.preventDefault());
    el.click();
    await nextTask();
    expect(el.pressed).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  test('the guards block activation and stop the click while disabled or loading', async () => {
    for (const template of [
      html`<div><line-icon-button pressed="false" disabled aria-label="Mute">${ICON}</line-icon-button></div>`,
      html`<div><line-icon-button pressed="false" loading aria-label="Mute">${ICON}</line-icon-button></div>`,
    ]) {
      const wrapper = await fixture<HTMLDivElement>(template);
      const el = wrapper.querySelector('line-icon-button') as LineIconButton;
      const clicks = mock();
      const changes = mock();
      el.addEventListener('click', clicks);
      wrapper.addEventListener('click', clicks);
      el.addEventListener('line-change', changes);
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
      await nextTask();
      expect(clicks).not.toHaveBeenCalled();
      expect(changes).not.toHaveBeenCalled();
      expect(el.pressed).toBe(false);
    }
  });
});

describe('<line-icon-button> machine-failure fallback', () => {
  test('renders disabled, loading and pressed as attributes when the machine fails to start', async () => {
    const { initialState } = buttonMachine;
    const consoleError = console.error;
    console.error = mock();
    buttonMachine.initialState = () => {
      throw new Error('machine start failure');
    };
    try {
      const el = await mount(
        html`<line-icon-button disabled loading pressed="true" aria-label="Mute">${ICON}</line-icon-button>`,
      );
      expect(console.error).toHaveBeenCalledTimes(1);
      const button = root(el);
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.getAttribute('aria-label')).toBe('Mute');
      expect(el.shadowRoot?.querySelector('[part="loading"]')).not.toBeNull();
      expect(el.hasAttribute('data-disabled')).toBe(true);
      expect(el.hasAttribute('data-loading')).toBe(true);

      const loading = await mount(html`<line-icon-button loading aria-label="Refresh">${ICON}</line-icon-button>`);
      expect(root(loading).getAttribute('aria-disabled')).toBe('true');
    } finally {
      buttonMachine.initialState = initialState;
      console.error = consoleError;
    }
  });
});
