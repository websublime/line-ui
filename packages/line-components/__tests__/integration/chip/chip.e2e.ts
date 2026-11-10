/**
 * `<line-chip>` browser tier (spec `0008-chip.md` Tests, Browser row; Phase 1 spec §7.8; §10 SD99).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/chip` with the border-width, radii,
 * sizing and typography tokens and `line-themes`; `no-theme.html` leaves `line-themes` out. Each test mounts its
 * markup into `<main>`. Keyboard, Tab order, focus-visible, activation, the form and `<fieldset disabled>`
 * behaviour, the computed colours and the accessible name live here, because happy-dom models none of them. The
 * engine's own accessibility node is read through a CDP session in chromium only.
 *
 * @module __tests__/integration/chip/chip.e2e
 */

import { type CDPSession, expect, type Locator, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/chip/';

/** A 12 px decorative glyph. */
const GLYPH =
  '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" fill="none" stroke="currentColor" /></svg>';

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-chip'));
}

/** Replaces the content of `<main>` and waits for every `line-chip` to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-chip')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
}

/** The id of the focused element, through the open shadow roots, as `host>inner`. */
function focusPath(page: Page): Promise<string> {
  return page.evaluate(() => {
    const parts: string[] = [];
    let active = document.activeElement;
    while (active) {
      parts.push(active.id || active.localName);
      active = active.shadowRoot?.activeElement ?? null;
    }
    return parts.join('>');
  });
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string, shift = false): string {
  const key = shift ? 'Shift+Tab' : 'Tab';
  return browserName === 'webkit' && process.platform === 'darwin' ? `Alt+${key}` : key;
}

function host(page: Page, id: string): Locator {
  return page.locator(`#${id}`);
}

/** Records every `line-change` value on the document as `window.lineChanges`. */
async function recordChanges(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: boolean[] = [];
    Object.assign(window, { lineChanges: seen });
    document.addEventListener('line-change', (event) =>
      seen.push((event as CustomEvent<{ value: boolean }>).detail.value),
    );
  });
}

/** The recorded `line-change` values, read two tasks after the caller's last action so the flip has run. */
function changes(page: Page): Promise<boolean[]> {
  return page.evaluate(
    () =>
      new Promise<boolean[]>((resolve) => {
        setTimeout(() => setTimeout(() => resolve((window as unknown as { lineChanges: boolean[] }).lineChanges)));
      }),
  );
}

/** Computed values of `[part="root"]` in the chip `#id`. */
function rootStyle(page: Page, id: string, properties: string[]): Promise<Record<string, string>> {
  return host(page, id).evaluate((el: HTMLElement, names) => {
    const style = getComputedStyle(el.shadowRoot?.querySelector('[part="root"]') as Element);
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
  }, properties);
}

test.describe('with line-tokens and line-themes', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test.describe('keyboard and focus', () => {
    test('Tab reaches an enabled chip and skips a disabled one', async ({ page, browserName }) => {
      await mount(
        page,
        `<button id="before">before</button>
        <line-chip id="on">In stock</line-chip>
        <line-chip id="off" disabled>Out of season</line-chip>
        <line-chip id="ship">Free shipping</line-chip>
        <button id="after">after</button>`,
      );
      await page.locator('#before').focus();
      await page.keyboard.press(tab(browserName));
      expect(await focusPath(page)).toBe('on>button');
      await page.keyboard.press(tab(browserName));
      expect(await focusPath(page)).toBe('ship>button');
      await page.keyboard.press(tab(browserName));
      expect(await focusPath(page)).toBe('after');
      await page.keyboard.press(tab(browserName, true));
      expect(await focusPath(page)).toBe('ship>button');
      await page.keyboard.press(tab(browserName, true));
      expect(await focusPath(page)).toBe('on>button');
    });

    test('host.focus() focuses the inner button through delegatesFocus', async ({ page }) => {
      await mount(page, '<line-chip id="on">In stock</line-chip>');
      await host(page, 'on').evaluate((el: HTMLElement) => el.focus());
      expect(await focusPath(page)).toBe('on>button');
    });

    test('Enter and Space flip the chip and fire line-change once each', async ({ page }) => {
      await mount(page, '<line-chip id="on">In stock</line-chip>');
      await recordChanges(page);
      await host(page, 'on').focus();
      await page.keyboard.press('Enter');
      await expect(host(page, 'on')).toHaveAttribute('pressed', '');
      await expect(host(page, 'on').getByRole('button')).toHaveAttribute('aria-pressed', 'true');
      await page.keyboard.press('Space');
      await expect(host(page, 'on')).not.toHaveAttribute('pressed');
      expect(await changes(page)).toEqual([true, false]);
      await expect(host(page, 'on').getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    test('arrow keys do nothing', async ({ page }) => {
      await mount(page, '<line-chip id="a">In stock</line-chip><line-chip id="b">Free shipping</line-chip>');
      await recordChanges(page);
      await host(page, 'a').focus();
      for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) await page.keyboard.press(key);
      expect(await focusPath(page)).toBe('a>button');
      expect(await changes(page)).toEqual([]);
    });

    test('data-focus-visible is set for keyboard focus only, not after a pointer click', async ({
      page,
      browserName,
    }) => {
      await mount(page, '<button id="before">before</button><line-chip id="on">In stock</line-chip>');
      const el = host(page, 'on');
      await el.click();
      await expect(el).not.toHaveAttribute('data-focus-visible');

      await page.locator('#before').focus();
      await page.keyboard.press(tab(browserName));
      await expect(el).toHaveAttribute('data-focus-visible', '');
      expect(await el.evaluate((chip) => chip.matches(':state(focus-visible)'))).toBe(true);
      await page.keyboard.press(tab(browserName, true));
      await expect(el).not.toHaveAttribute('data-focus-visible');
    });
  });

  test.describe('activation', () => {
    test('a pointer click flips the chip once and fires line-change after pressed changed', async ({ page }) => {
      await mount(page, '<line-chip id="on">In stock</line-chip>');
      await page.evaluate(() => {
        const seen: string[] = [];
        Object.assign(window, { lineSeen: seen });
        const chip = document.getElementById('on') as HTMLElement & { pressed: boolean };
        chip.addEventListener('line-change', (event) =>
          seen.push(`${(event as CustomEvent<{ value: boolean }>).detail.value}:${chip.pressed}`),
        );
      });
      await host(page, 'on').click();
      await expect(host(page, 'on')).toHaveAttribute('data-pressed', '');
      expect(await page.evaluate(() => (window as unknown as { lineSeen: string[] }).lineSeen)).toEqual(['true:true']);
    });

    test('no click reaches host or ancestor listeners while disabled, and nothing flips', async ({ page }) => {
      await mount(page, '<div id="wrap"><line-chip id="off" disabled>Out of season</line-chip></div>');
      await recordChanges(page);
      await page.evaluate(() => {
        const clicks: string[] = [];
        Object.assign(window, { lineClicks: clicks });
        document.getElementById('off')?.addEventListener('click', () => clicks.push('host'));
        document.getElementById('wrap')?.addEventListener('click', () => clicks.push('wrap'));
        document.addEventListener('click', () => clicks.push('document'));
      });
      await host(page, 'off').click({ force: true });
      await host(page, 'off').evaluate((el: HTMLElement) => el.click());
      expect(await changes(page)).toEqual([]);
      expect(await page.evaluate(() => (window as unknown as { lineClicks: string[] }).lineClicks)).toEqual([]);
      await expect(host(page, 'off')).not.toHaveAttribute('pressed');
    });

    test('preventDefault on click cancels the flip; stopPropagation does not', async ({ page }) => {
      await mount(page, '<line-chip id="on">In stock</line-chip>');
      await recordChanges(page);
      await page.evaluate(() => {
        document.querySelector('#on')?.addEventListener('click', (event) => event.preventDefault(), { once: true });
      });
      await host(page, 'on').click();
      expect(await changes(page)).toEqual([]);
      await expect(host(page, 'on')).not.toHaveAttribute('pressed');

      await page.evaluate(() => {
        document.querySelector('#on')?.addEventListener('click', (event) => event.stopPropagation(), { once: true });
      });
      await host(page, 'on').click();
      expect(await changes(page)).toEqual([true]);
      await expect(host(page, 'on')).toHaveAttribute('pressed', '');
    });

    test('chips in a row toggle on their own', async ({ page }) => {
      await mount(
        page,
        '<line-chip id="a" pressed>In stock</line-chip><line-chip id="b">Free shipping</line-chip><line-chip id="c">On sale</line-chip>',
      );
      await host(page, 'b').click();
      await expect(host(page, 'b')).toHaveAttribute('pressed', '');
      await expect(host(page, 'a')).toHaveAttribute('pressed', '');
      await expect(host(page, 'c')).not.toHaveAttribute('pressed');
    });
  });

  test.describe('form behaviour (not form-associated)', () => {
    test('inside a form, a click, Enter and Space submit nothing, reset nothing and add no form data', async ({
      page,
    }) => {
      await mount(
        page,
        `<form><input id="q" name="q" value="initial" />
          <line-chip id="on" name="stock" value="1">In stock</line-chip></form>`,
      );
      await page.evaluate(() => {
        Object.assign(window, { lineSubmits: 0, lineResets: 0 });
        const form = document.querySelector('form') as HTMLFormElement;
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          (window as unknown as { lineSubmits: number }).lineSubmits += 1;
        });
        form.addEventListener('reset', () => {
          (window as unknown as { lineResets: number }).lineResets += 1;
        });
      });
      await recordChanges(page);
      await page.locator('#q').fill('edited');
      const el = host(page, 'on');
      await el.click();
      await el.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');

      expect(await changes(page)).toEqual([true, false, true]);
      expect(
        await page.evaluate(() => {
          const state = window as unknown as { lineSubmits: number; lineResets: number };
          const form = document.querySelector('form') as HTMLFormElement;
          return {
            submits: state.lineSubmits,
            resets: state.lineResets,
            data: [...new FormData(form).entries()].map(([key, value]) => `${key}=${String(value)}`),
          };
        }),
      ).toEqual({ submits: 0, resets: 0, data: ['q=edited'] });
      await expect(page.locator('#q')).toHaveValue('edited');
      expect(page.url()).toBe(FIXTURE_URL);
      expect(
        await el.evaluate((chip: HTMLElement) => {
          const inner = chip.shadowRoot?.querySelector('button');
          return {
            formAssociated: Reflect.get(chip.constructor, 'formAssociated') ?? false,
            innerForm: inner?.form,
            innerType: inner?.type,
          };
        }),
      ).toEqual({ formAssociated: false, innerForm: null, innerType: 'button' });
    });

    test('a <fieldset disabled> ancestor does not disable it: it stays focusable and flips', async ({
      page,
      browserName,
    }) => {
      await mount(
        page,
        `<form><fieldset id="set" disabled>
          <button id="native" type="button">native</button>
          <line-chip id="on">In stock</line-chip>
        </fieldset><button id="before" type="button">before</button></form>`,
      );
      await recordChanges(page);
      const el = host(page, 'on');
      // The control: the native button in the same fieldset is disabled.
      await expect(page.locator('#native')).toBeDisabled();
      await expect(el).not.toHaveAttribute('data-disabled');
      await expect(el.getByRole('button')).toBeEnabled();

      await page.locator('#before').focus();
      await page.keyboard.press(tab(browserName, true));
      expect(await focusPath(page)).toBe('on>button');
      await page.keyboard.press('Enter');
      await el.click();
      expect(await changes(page)).toEqual([true, false]);
    });
  });

  test.describe('colours (F4, F8, F10)', () => {
    /** Every palette step the chip reads, each its own colour, so a wrong step or role shows. */
    const ACCENT = { bg: 'rgb(1, 3, 99)', border: 'rgb(1, 7, 99)', solid: 'rgb(1, 9, 99)', text: 'rgb(1, 12, 99)' };
    const CONTRAST = 'rgb(1, 50, 99)';
    const GRAY = { bg: 'rgb(2, 3, 99)', border: 'rgb(2, 7, 99)', text: 'rgb(2, 12, 99)' };
    const PALETTE = [
      `--line-indigo-3: ${ACCENT.bg}`,
      `--line-indigo-7: ${ACCENT.border}`,
      `--line-indigo-9: ${ACCENT.solid}`,
      `--line-indigo-12: ${ACCENT.text}`,
      `--line-indigo-contrast: ${CONTRAST}`,
      ...['sand', 'slate'].flatMap((hue) => [
        `--line-${hue}-3: ${GRAY.bg}`,
        `--line-${hue}-7: ${GRAY.border}`,
        `--line-${hue}-12: ${GRAY.text}`,
      ]),
    ].join('; ');

    test('each variant and pressed state takes its colour row; a missing or unknown variant is default', async ({
      page,
    }) => {
      // `line-colors` is not a `line-components` dependency, so the page sets the palette steps the role aliases read
      // (spec 0008-chip.md Tests).
      const cases = [
        ['none-off', '', false, [GRAY.bg, GRAY.text, GRAY.border]],
        ['none-on', '', true, [ACCENT.bg, ACCENT.text, ACCENT.border]],
        ['default-off', 'default', false, [GRAY.bg, GRAY.text, GRAY.border]],
        ['default-on', 'default', true, [ACCENT.bg, ACCENT.text, ACCENT.border]],
        ['bogus-off', 'bogus', false, [GRAY.bg, GRAY.text, GRAY.border]],
        ['bogus-on', 'bogus', true, [ACCENT.bg, ACCENT.text, ACCENT.border]],
        ['primary-off', 'primary', false, ['rgba(0, 0, 0, 0)', ACCENT.text, ACCENT.border]],
        ['primary-on', 'primary', true, [ACCENT.solid, CONTRAST, ACCENT.solid]],
      ] as const;
      await mount(
        page,
        `<style>html { ${PALETTE} }</style>${cases
          .map(
            ([id, variant, pressed]) =>
              `<line-chip id="${id}" ${variant ? `variant="${variant}"` : ''} ${pressed ? 'pressed' : ''}>Chip</line-chip>`,
          )
          .join('')}`,
      );
      for (const [id, , , [bg, color, border]] of cases) {
        expect({ id, ...(await rootStyle(page, id, ['background-color', 'color', 'border-top-color'])) }).toEqual({
          id,
          'background-color': bg,
          color,
          'border-top-color': border,
        });
      }
    });

    test('a user press switches the colours to the pressed row', async ({ page }) => {
      await mount(page, `<style>html { ${PALETTE} }</style><line-chip id="on">In stock</line-chip>`);
      await host(page, 'on').click();
      await expect(host(page, 'on')).toHaveAttribute('data-pressed', '');
      expect(await rootStyle(page, 'on', ['background-color'])).toEqual({ 'background-color': ACCENT.bg });
    });

    test('root draws a solid border, a round radius and the size tokens', async ({ page }) => {
      await mount(page, '<line-chip id="on">In stock</line-chip>');
      const style = await rootStyle(page, 'on', [
        'border-top-style',
        'border-top-width',
        'border-top-left-radius',
        'min-height',
        'padding-left',
        'font-size',
        'font-weight',
      ]);
      expect(style).toEqual({
        'border-top-style': 'solid',
        'border-top-width': '1px',
        'border-top-left-radius': '100000px',
        'min-height': '28px',
        'padding-left': '16px',
        'font-size': '16px',
        'font-weight': '500',
      });
    });
  });

  test.describe('accessible name', () => {
    test('the name is the slotted content in tree order, and a suffix count joins it', async ({ page }) => {
      await mount(
        page,
        `<line-chip id="unread" pressed>
          <span slot="indicator">${GLYPH}</span>
          <span slot="prefix">${GLYPH}</span>
          Unread
          <span slot="suffix">12</span>
        </line-chip>
        <line-chip id="labelled" aria-label="Unread, 12 messages">Unread <span slot="suffix">12</span></line-chip>`,
      );
      await expect(host(page, 'unread').getByRole('button')).toHaveAccessibleName('Unread 12');
      await expect(host(page, 'labelled').getByRole('button')).toHaveAccessibleName('Unread, 12 messages');
    });

    test('ariaSnapshot: one button node per host with the expected name and pressed state', async ({ page }) => {
      await mount(
        page,
        `<line-chip id="off">In stock</line-chip>
        <line-chip id="on" pressed>Free shipping</line-chip>
        <line-chip id="primary" variant="primary" pressed>Open now</line-chip>
        <line-chip id="disabled" disabled>Out of season</line-chip>`,
      );
      const main = page.locator('main');
      await expect(main.getByRole('button')).toHaveCount(4);
      await expect(host(page, 'off').getByRole('button', { name: 'In stock', pressed: false })).toBeVisible();
      await expect(host(page, 'on').getByRole('button', { name: 'Free shipping', pressed: true })).toBeVisible();
      await expect(host(page, 'primary').getByRole('button', { name: 'Open now', pressed: true })).toBeVisible();
      await expect(host(page, 'disabled').getByRole('button', { name: 'Out of season' })).toBeDisabled();

      const snapshot = await main.ariaSnapshot();
      expect(snapshot).toContain('button "In stock"');
      expect(snapshot).toContain('button "Free shipping" [pressed]');
      expect(snapshot).toContain('button "Open now" [pressed]');
      expect(snapshot).toContain('button "Out of season" [disabled]');
      test.info().annotations.push({ type: 'ariaSnapshot', description: `${test.info().project.name}\n${snapshot}` });
    });
  });
});

test.describe('without line-themes', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'no-theme.html');
  });

  test('every variant and state has a transparent background, a currentColor border and the inherited text colour', async ({
    page,
  }) => {
    await mount(
      page,
      `<div style="color: rgb(200, 0, 0)">
        <line-chip id="off">A</line-chip>
        <line-chip id="on" pressed>B</line-chip>
        <line-chip id="primary-off" variant="primary">C</line-chip>
        <line-chip id="primary-on" variant="primary" pressed>D</line-chip>
      </div>`,
    );
    for (const id of ['off', 'on', 'primary-off', 'primary-on']) {
      expect({
        id,
        ...(await rootStyle(page, id, ['background-color', 'border-top-color', 'border-top-style', 'color'])),
      }).toEqual({
        id,
        'background-color': 'rgba(0, 0, 0, 0)',
        'border-top-color': 'rgb(200, 0, 0)',
        'border-top-style': 'solid',
        color: 'rgb(200, 0, 0)',
      });
    }
  });
});

/** The CDP accessibility node of the inner `<button>` of `#id`. */
async function innerAxNode(
  cdp: CDPSession,
  id: string,
): Promise<{
  role?: { value: string };
  name?: { value: string };
  properties?: { name: string; value: { value: unknown } }[];
}> {
  const { result } = await cdp.send('Runtime.evaluate', {
    expression: `document.getElementById(${JSON.stringify(id)}).shadowRoot.querySelector('button')`,
  });
  if (!result.objectId) throw new Error(`no inner button in #${id}`);
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
    objectId: result.objectId,
    fetchRelatives: false,
  });
  return nodes[0] as {
    role?: { value: string };
    name?: { value: string };
    properties?: { name: string; value: { value: unknown } }[];
  };
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('the inner button exposes role button, its name, pressed and disabled', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<line-chip id="off">In stock</line-chip>
      <line-chip id="on" pressed>Free shipping</line-chip>
      <line-chip id="disabled" disabled>Out of season</line-chip>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const read = async (id: string) => {
      const node = await innerAxNode(cdp, id);
      const property = (name: string) => node.properties?.find((each) => each.name === name)?.value.value;
      return [node.role?.value, node.name?.value, property('pressed'), property('disabled') ?? false];
    };
    expect(await read('off')).toEqual(['button', 'In stock', 'false', false]);
    expect(await read('on')).toEqual(['button', 'Free shipping', 'true', false]);
    expect(await read('disabled')).toEqual(['button', 'Out of season', 'false', true]);
  });
});
