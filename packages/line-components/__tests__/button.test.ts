/**
 * `<line-button>` unit tier (spec `0002-button.md` Tests, Unit row).
 *
 * Runs on happy-dom through `bun-test-preload.ts`, whose fake internals record
 * `setValidity` calls and hold the custom states. The component comes from
 * `src/` and `line-core` from its built `dist/` through the declared dependency
 * (spec §7.8 rules 1 and 3), so this file needs `bun run build` first, as the
 * CI unit tier has. Keyboard, focus-visible, pointer presses and the form
 * behaviour live in the browser tier (`integration/button/button.e2e.ts`).
 *
 * @module __tests__/button
 */

import { describe, expect, mock, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { INTERNALS } from '@websublime/line-core';
import { LineButton } from '../src/button/index.js';
import { buttonMachine } from '../src/shared/button-machine.js';

/** The fields of the preload's fake internals these tests read. */
interface RecordingInternals {
  calls: { method: string; args: unknown[] }[];
  states: Set<string>;
}

function internals(el: LineButton): RecordingInternals {
  return Reflect.get(el, INTERNALS) as RecordingInternals;
}

function root(el: LineButton): HTMLButtonElement {
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
async function settle(el: LineButton): Promise<void> {
  await nextTask();
  await el.updateComplete;
}

async function mount(template = html`<line-button>Save</line-button>`): Promise<LineButton> {
  return fixture<LineButton>(template);
}

describe('<line-button> defaults and reflection', () => {
  test('registers line-button with the LineButton class', () => {
    expect(customElements.get('line-button')).toBe(LineButton);
    expect(LineButton.formAssociated).toBe(true);
  });

  test('renders the C8 empty state with no attributes', async () => {
    const el = await mount(html`<line-button></line-button>`);
    expect(el.variant).toBe('default');
    expect(el.type).toBe('submit');
    expect(el.disabled).toBe(false);
    expect(el.loading).toBe(false);
    expect(el.pressed).toBeUndefined();
    expect(el.value).toBe('');
    expect(el.formAction).toBe('');
    expect(el.formNoValidate).toBe(false);
    expect(el.customValidity).toBe('');
    expect(el.name).toBeNull();
    expect(el.getAttribute('variant')).toBe('default');
    expect(el.getAttribute('type')).toBe('submit');
    for (const name of ['disabled', 'loading', 'pressed', 'value', 'formaction', 'formnovalidate']) {
      expect(el.hasAttribute(name)).toBe(false);
    }

    const button = root(el);
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('disabled')).toBe(false);
    for (const name of ['aria-pressed', 'aria-disabled', 'aria-label', 'aria-description']) {
      expect(button.hasAttribute(name)).toBe(false);
    }
    expect(button.querySelector('slot[name="prefix"]')).not.toBeNull();
    expect(button.querySelector('[part="label"] > slot:not([name])')).not.toBeNull();
    expect(button.querySelector('slot[name="suffix"]')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('[part="loading"]')).toBeNull();
    expect(el.shadowRoot?.querySelector('slot[name="loading"]')).toBeNull();
  });

  test('reflects every reflecting property to its attribute', async () => {
    const el = await mount();
    el.variant = 'primary';
    el.type = 'reset';
    el.disabled = true;
    el.loading = true;
    el.value = 'save';
    el.formAction = '/publish';
    el.formMethod = 'post';
    el.formEnctype = 'multipart/form-data';
    el.formTarget = '_blank';
    el.formNoValidate = true;
    el.customValidity = 'Not yet';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('primary');
    expect(el.getAttribute('type')).toBe('reset');
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(el.hasAttribute('loading')).toBe(true);
    expect(el.getAttribute('value')).toBe('save');
    expect(el.getAttribute('formaction')).toBe('/publish');
    expect(el.getAttribute('formmethod')).toBe('post');
    expect(el.getAttribute('formenctype')).toBe('multipart/form-data');
    expect(el.getAttribute('formtarget')).toBe('_blank');
    expect(el.hasAttribute('formnovalidate')).toBe(true);
    expect(el.hasAttribute('custom-validity')).toBe(false);
  });

  test('reads every attribute into its property', async () => {
    const el = await mount(
      html`<line-button
        name="intent"
        value="publish"
        formaction="/orders/publish"
        formmethod="get"
        formenctype="text/plain"
        formtarget="_self"
        formnovalidate
        custom-validity="Pick one"
        >Publish</line-button
      >`,
    );
    expect(el.name).toBe('intent');
    expect(el.value).toBe('publish');
    expect(el.formAction).toBe('/orders/publish');
    expect(el.formMethod).toBe('get');
    expect(el.formEnctype).toBe('text/plain');
    expect(el.formTarget).toBe('_self');
    expect(el.formNoValidate).toBe(true);
    expect(el.customValidity).toBe('Pick one');
  });
});

describe('<line-button> converters', () => {
  test('variant: an unknown value behaves as default and the attribute keeps what the author wrote', async () => {
    const el = await mount(html`<line-button variant="borderless">Cancel</line-button>`);
    expect(el.variant).toBe('borderless');
    el.setAttribute('variant', 'loud');
    await el.updateComplete;
    expect(el.variant).toBe('default');
    expect(el.getAttribute('variant')).toBe('loud');
  });

  test('type: reset and button parse, case-insensitively; unknown and missing values behave as submit', async () => {
    const el = await mount(html`<line-button type="reset">Reset</line-button>`);
    expect(el.type).toBe('reset');
    el.setAttribute('type', 'BUTTON');
    expect(el.type).toBe('button');
    el.setAttribute('type', 'menu');
    expect(el.type).toBe('submit');
    expect(el.getAttribute('type')).toBe('menu');
    el.removeAttribute('type');
    expect(el.type).toBe('submit');
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

describe('<line-button> state reflection', () => {
  test('pressed, loading and disabled reflect as data-* and :state()', async () => {
    const el = await mount(html`<line-button pressed="true" loading disabled>Bold</line-button>`);
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
      html`<line-button loading>Save</line-button>`,
      html`<line-button disabled>Save</line-button>`,
    ]) {
      const el = await mount(template);
      root(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      root(el).dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, composed: true }));
      await settle(el);
      expect(el.hasAttribute('data-active')).toBe(false);
    }
  });

  test('a disabled fieldset ancestor disables the button through formDisabledCallback', async () => {
    const el = await mount();
    el.formDisabledCallback(true);
    await el.updateComplete;
    expect(el.hasAttribute('data-disabled')).toBe(true);
    expect(root(el).disabled).toBe(true);
    expect(el.disabled).toBe(false);
    el.formDisabledCallback(false);
    await el.updateComplete;
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(root(el).disabled).toBe(false);
  });
});

describe('<line-button> ARIA on the inner button', () => {
  test('copies aria-label and aria-description from the host', async () => {
    const el = await mount(
      html`<line-button aria-label="Save draft" aria-description="Keeps a copy">Save</line-button>`,
    );
    expect(root(el).getAttribute('aria-label')).toBe('Save draft');
    expect(root(el).getAttribute('aria-description')).toBe('Keeps a copy');
    expect(el.getAttribute('aria-label')).toBe('Save draft');
    el.removeAttribute('aria-label');
    el.setAttribute('aria-description', 'Overwrites the copy');
    await el.updateComplete;
    expect(root(el).hasAttribute('aria-label')).toBe(false);
    expect(root(el).getAttribute('aria-description')).toBe('Overwrites the copy');
  });

  test('aria-pressed follows pressed on a toggle and is absent otherwise', async () => {
    const el = await mount(html`<line-button type="button" pressed="false">Bold</line-button>`);
    expect(root(el).getAttribute('aria-pressed')).toBe('false');
    el.pressed = true;
    await el.updateComplete;
    expect(root(el).getAttribute('aria-pressed')).toBe('true');
    el.pressed = undefined;
    await el.updateComplete;
    expect(root(el).hasAttribute('aria-pressed')).toBe(false);
  });

  test('loading sets aria-disabled, keeps the button enabled and renders the loading part', async () => {
    const el = await mount(html`<line-button loading>Save<span slot="loading">Saving…</span></line-button>`);
    expect(root(el).getAttribute('aria-disabled')).toBe('true');
    expect(root(el).disabled).toBe(false);
    expect(el.shadowRoot?.querySelector('[part="loading"] > slot[name="loading"]')).not.toBeNull();
    el.loading = false;
    await el.updateComplete;
    expect(root(el).hasAttribute('aria-disabled')).toBe(false);
    expect(el.shadowRoot?.querySelector('[part="loading"]')).toBeNull();
  });

  test('disabled sets native disabled and no aria-disabled, even while loading', async () => {
    const el = await mount(html`<line-button disabled loading>Save</line-button>`);
    expect(root(el).disabled).toBe(true);
    expect(root(el).hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('<line-button> activation and line-change', () => {
  test('fires line-change once per toggle activation with the new state', async () => {
    const el = await mount(html`<line-button type="button" pressed="false">Bold</line-button>`);
    const seen: CustomEvent<{ value: boolean }>[] = [];
    document.addEventListener('line-change', (event) => seen.push(event as CustomEvent<{ value: boolean }>));

    el.click();
    await nextTask();
    expect(el.pressed).toBe(true);
    root(el).click();
    await nextTask();
    expect(el.pressed).toBe(false);

    expect(seen.map((event) => event.detail)).toEqual([{ value: true }, { value: false }]);
    expect(seen.every((event) => event.target === el && event.bubbles && !event.composed)).toBe(true);
  });

  test('never fires line-change on a property or attribute change, or on a plain button', async () => {
    const el = await mount(html`<line-button type="button" pressed="false">Bold</line-button>`);
    const listener = mock();
    el.addEventListener('line-change', listener);
    el.pressed = true;
    await el.updateComplete;
    el.setAttribute('pressed', 'false');
    await el.updateComplete;

    const plain = await mount(html`<line-button type="button">Run</line-button>`);
    plain.addEventListener('line-change', listener);
    plain.click();
    await nextTask();
    expect(plain.pressed).toBeUndefined();
    expect(listener).not.toHaveBeenCalled();
  });

  test('a click listener that calls preventDefault cancels the toggle', async () => {
    const el = await mount(html`<line-button type="button" pressed="false">Bold</line-button>`);
    const listener = mock();
    el.addEventListener('line-change', listener);
    el.addEventListener('click', (event) => event.preventDefault());
    el.click();
    await nextTask();
    expect(el.pressed).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  test('stopPropagation does not cancel the activation', async () => {
    const el = await mount(html`<line-button type="button" pressed="false">Bold</line-button>`);
    el.addEventListener('click', (event) => event.stopPropagation());
    el.click();
    await nextTask();
    expect(el.pressed).toBe(true);
  });

  test('the guards block activation and stop the click while disabled or loading', async () => {
    for (const template of [
      html`<div><line-button type="button" pressed="false" disabled>Bold</line-button></div>`,
      html`<div><line-button type="button" pressed="false" loading>Bold</line-button></div>`,
    ]) {
      const wrapper = await fixture<HTMLDivElement>(template);
      const el = wrapper.querySelector('line-button') as LineButton;
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

describe('<line-button> custom-validity', () => {
  function lastValidity(el: LineButton): unknown[] | undefined {
    return internals(el)
      .calls.filter((call) => call.method === 'setValidity')
      .at(-1)?.args;
  }

  test('sets customError only under type="submit" and clears it otherwise', async () => {
    const el = await mount();
    el.customValidity = 'Choose a plan first';
    await el.updateComplete;
    expect(lastValidity(el)).toEqual([{ customError: true }, 'Choose a plan first', root(el)]);
    expect(el.hasAttribute('data-invalid')).toBe(true);
    expect(internals(el).states.has('invalid')).toBe(true);

    el.type = 'reset';
    await el.updateComplete;
    expect(lastValidity(el)).toEqual([{}]);
    expect(el.hasAttribute('data-invalid')).toBe(false);
    expect(internals(el).states.has('invalid')).toBe(false);

    el.type = 'button';
    await el.updateComplete;
    expect(lastValidity(el)).toEqual([{}]);

    el.type = 'submit';
    await el.updateComplete;
    expect(lastValidity(el)).toEqual([{ customError: true }, 'Choose a plan first', root(el)]);

    el.customValidity = '';
    await el.updateComplete;
    expect(lastValidity(el)).toEqual([{}]);
    expect(el.hasAttribute('data-invalid')).toBe(false);
  });
});

describe('<line-button> machine-failure fallback', () => {
  test('renders disabled and loading as attributes when the machine fails to start', async () => {
    const { initialState } = buttonMachine;
    const consoleError = console.error;
    console.error = mock();
    buttonMachine.initialState = () => {
      throw new Error('machine start failure');
    };
    try {
      const el = await mount(html`<line-button disabled loading pressed="true">Save</line-button>`);
      expect(console.error).toHaveBeenCalledTimes(1);
      const button = root(el);
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(el.shadowRoot?.querySelector('[part="loading"]')).not.toBeNull();
      expect(el.hasAttribute('data-disabled')).toBe(true);
      expect(el.hasAttribute('data-loading')).toBe(true);

      const loading = await mount(html`<line-button loading>Save</line-button>`);
      expect(root(loading).getAttribute('aria-disabled')).toBe('true');
    } finally {
      buttonMachine.initialState = initialState;
      console.error = consoleError;
    }
  });
});
