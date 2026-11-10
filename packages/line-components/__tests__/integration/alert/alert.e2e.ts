/**
 * `<line-alert>` browser tier (spec `0006-alert.md` Tests, Browser and Accessibility tree rows; Phase 1 spec §7.8,
 * §6.C.4 notes, §12 AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/alert` with the border-width, radii
 * and sizing tokens, `line-themes`, and `./icon-button` for the Dismiss recipe; `no-theme.html` leaves `line-themes`
 * out. Each test mounts its markup into `<main>`. The internals role is read back through the `INTERNALS` symbol the
 * fixture re-exports, in every engine; the accessibility tree is read through a CDP session in chromium only.
 *
 * @module __tests__/integration/alert/alert.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/alert/';

/** `--line-border-1`, `--line-size-3` and `--line-size-2` from `line-tokens`. */
const BORDER = 1;
const PADDING = 16;
const GAP = 8;
const INSET = BORDER + PADDING;

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-alert'));
}

/** Replaces the content of `<main>` and waits for every line element to render and read its slots. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...main.querySelectorAll('line-alert, line-icon-button')].map(
          (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
        ),
      );
    await settle();
    const frame = Promise.withResolvers<number>();
    requestAnimationFrame(frame.resolve);
    await frame.promise;
    await settle();
  }, markup);
}

type Box = { left: number; right: number; top: number; bottom: number; width: number; height: number };

/** The border box of `part` in the shadow root of the alert matched by `selector`, or of the host itself. */
function box(page: Page, part?: string, selector = 'line-alert'): Promise<Box> {
  return page.evaluate(
    ([name, sel]) => {
      const host = document.querySelector(`main ${sel}`) as HTMLElement;
      const element = name ? (host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement) : host;
      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    },
    [part, selector] as const,
  );
}

/** Computed values of `part` in the alert matched by `selector`, or of the host itself. */
function computed(
  page: Page,
  properties: string[],
  part?: string,
  selector = 'line-alert',
): Promise<Record<string, string>> {
  return page.evaluate(
    ([names, name, sel]) => {
      const host = document.querySelector(`main ${sel}`) as HTMLElement;
      const element = name ? (host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement) : host;
      const style = getComputedStyle(element);
      return Object.fromEntries(names.map((property) => [property, style.getPropertyValue(property)]));
    },
    [properties, part, selector] as const,
  );
}

/** The zones whose wrapper renders, by part name. */
function shownZones(page: Page, selector = 'line-alert'): Promise<string[]> {
  return page.evaluate((sel) => {
    const host = document.querySelector(`main ${sel}`) as HTMLElement;
    return ['icon', 'title', 'description', 'actions', 'dismiss'].filter(
      (zone) => getComputedStyle(host.shadowRoot?.querySelector(`[part="${zone}"]`) as Element).display !== 'none',
    );
  }, selector);
}

function expectNear(actual: number, expected: number, label: string): void {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThan(0.5);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

const FILLED = `<line-alert variant="danger" style="inline-size: 480px">
  <span slot="icon" style="display: block; inline-size: 20px; block-size: 20px"></span>
  <h3 slot="title" style="font-size: 16px">Payment failed</h3>
  <p style="font-size: 16px">Check the card number and try again. The bank declined the charge.</p>
  <button slot="actions" style="inline-size: 120px">Retry</button>
  <button slot="actions" style="inline-size: 120px">Use another card</button>
</line-alert>`;

/** Every palette step the alert reads, each its own colour, so a wrong step or role shows (spec AM-001 of 0011). */
const ROLES = { gray: 10, info: 20, success: 30, warning: 40, danger: 50 } as const;
const PALETTE = { gray: ['sand', 'slate'], info: ['blue'], success: ['green'], warning: ['amber'], danger: ['red'] };
const STEPS = { bg: 3, border: 7, low: 11, text: 12 } as const;
const rgb = (role: keyof typeof ROLES, step: number) => `rgb(${ROLES[role]}, ${step}, 99)`;

test.describe('with line-tokens and line-themes', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('each variant takes its role colours; a missing or unknown variant takes gray', async ({ page }) => {
    // `line-colors` is not a `line-components` dependency, so the page sets the palette steps the role aliases read
    // (spec 0006-alert.md Tests; 0011-separator.md AM-001).
    const palette = Object.entries(PALETTE)
      .flatMap(([role, hues]) =>
        hues.flatMap((hue) =>
          Object.values(STEPS).map((step) => `--line-${hue}-${step}: ${rgb(role as keyof typeof ROLES, step)};`),
        ),
      )
      .join(' ');
    const cases = [
      ['none', '', 'gray'],
      ['neutral', 'neutral', 'gray'],
      ['bogus', 'bogus', 'gray'],
      ['info', 'info', 'info'],
      ['success', 'success', 'success'],
      ['warning', 'warning', 'warning'],
      ['danger', 'danger', 'danger'],
    ] as const;
    await mount(
      page,
      `<style>html { ${palette} }</style>${cases
        .map(
          ([id, variant]) =>
            `<line-alert id="${id}" ${variant ? `variant="${variant}"` : ''}><span slot="icon">!</span>Text</line-alert>`,
        )
        .join('')}`,
    );
    for (const [id, , role] of cases) {
      const root = await computed(page, ['background-color', 'color', 'border-top-color'], 'root', `#${id}`);
      const icon = await computed(page, ['color'], 'icon', `#${id}`);
      expect({ id, ...root, icon: icon.color }).toEqual({
        id,
        'background-color': rgb(role, STEPS.bg),
        color: rgb(role, STEPS.text),
        'border-top-color': rgb(role, STEPS.border),
        icon: rgb(role, STEPS.low),
      });
    }
  });

  test('root draws a solid border on every side, with the radius and padding tokens', async ({ page }) => {
    await mount(page, '<line-alert>Text</line-alert>');
    const sides = ['top', 'right', 'bottom', 'left'];
    const style = await computed(
      page,
      [
        ...sides.flatMap((side) => [`border-${side}-style`, `border-${side}-width`]),
        'border-top-left-radius',
        'padding-top',
        'padding-left',
        'display',
      ],
      'root',
    );
    expect(style).toEqual({
      ...Object.fromEntries(
        sides.flatMap((side) => [
          [`border-${side}-style`, 'solid'],
          [`border-${side}-width`, '1px'],
        ]),
      ),
      'border-top-left-radius': '5px',
      'padding-top': '16px',
      'padding-left': '16px',
      display: 'grid',
    });
    expect((await computed(page, ['display'])).display).toBe('block');
  });

  test('every slot filled: icon at the block start of row 1, actions in a wrapping row below the message', async ({
    page,
  }) => {
    await mount(page, FILLED);
    const [root, icon, content, title, description, actions] = await Promise.all(
      ['root', 'icon', 'content', 'title', 'description', 'actions'].map((part) => box(page, part)),
    );
    expectNear(icon.left, root.left + INSET, 'icon at the inline start');
    expectNear(icon.top, root.top + INSET, 'icon at the block start');
    expect(icon.height).toBeLessThan(content.height);
    expectNear(content.left, icon.right + GAP, 'content after the icon and the gap');
    expectNear(content.top, icon.top, 'content in row 1');
    expectNear(content.right, root.right - INSET, 'content to the inline end');
    expectNear(description.top, title.bottom + GAP, 'message below the title');
    expectNear(actions.top, content.bottom + GAP, 'actions in row 2');
    expectNear(actions.left, content.left, 'actions in the content column');
    expectNear(actions.right, content.right, 'actions span the content column');
    expectNear(root.bottom, actions.bottom + INSET, 'nothing below the actions');
    const buttons = await page.evaluate(() =>
      [...document.querySelectorAll('main button')].map((button) => {
        const { left, right, top } = button.getBoundingClientRect();
        return { left, right, top };
      }),
    );
    expectNear(buttons[1]?.left ?? 0, (buttons[0]?.right ?? 0) + GAP, 'actions spaced by the gap');
    expectNear(buttons[1]?.top ?? 0, buttons[0]?.top ?? 0, 'actions in one row');
  });

  test('the actions wrap onto a new line when the row runs out of space', async ({ page }) => {
    await mount(page, FILLED.replace('inline-size: 480px', 'inline-size: 260px'));
    const tops = await page.evaluate(() =>
      [...document.querySelectorAll('main button')].map((button) => button.getBoundingClientRect().top),
    );
    expect((tops[1] ?? 0) > (tops[0] ?? 0)).toBe(true);
    const actions = await box(page, 'actions');
    const content = await box(page, 'content');
    expectNear(actions.left, content.left, 'wrapped actions stay in the content column');
  });

  test('an empty zone leaves no box and no track gap', async ({ page }) => {
    await mount(page, FILLED.replace(/<span slot="icon"[^>]*><\/span>/, ''));
    expect(await shownZones(page)).toEqual(['title', 'description', 'actions']);
    expectNear((await box(page, 'content')).left, (await box(page, 'root')).left + INSET, 'no icon, no gap');

    await mount(page, FILLED.replace(/<button slot="actions"[^>]*>[^<]*<\/button>/g, ''));
    expect(await shownZones(page)).toEqual(['icon', 'title', 'description']);
    expectNear((await box(page, 'root')).bottom, (await box(page, 'content')).bottom + INSET, 'no actions, no row gap');

    await mount(page, FILLED.replace(/<h3 slot="title"[^>]*>[^<]*<\/h3>/, ''));
    expect(await shownZones(page)).toEqual(['icon', 'description', 'actions']);
    expectNear((await box(page, 'description')).top, (await box(page, 'content')).top, 'no title, no gap');

    await mount(page, FILLED.replace(/<p[^>]*>[^<]*<\/p>/, ''));
    expect(await shownZones(page)).toEqual(['icon', 'title', 'actions']);
    expectNear((await box(page, 'title')).bottom, (await box(page, 'content')).bottom, 'no message, no gap');
  });

  test('under dir="rtl" the zones mirror, with no extra rule', async ({ page }) => {
    await mount(page, `<div dir="rtl">${FILLED}</div>`);
    const [root, icon, content, actions] = await Promise.all(
      ['root', 'icon', 'content', 'actions'].map((part) => box(page, part)),
    );
    expectNear(icon.right, root.right - INSET, 'icon at the inline start, on the right');
    expectNear(icon.top, root.top + INSET, 'icon at the block start');
    expectNear(content.right, icon.left - GAP, 'content after the icon and the gap');
    expectNear(content.left, root.left + INSET, 'content to the inline end, on the left');
    expectNear(actions.right, content.right, 'actions in the content column');
    expectNear(actions.top, content.bottom + GAP, 'actions in row 2');

    await mount(page, `<div dir="rtl">${FILLED.replace(/<span slot="icon"[^>]*><\/span>/, '')}</div>`);
    expectNear((await box(page, 'content')).right, (await box(page, 'root')).right - INSET, 'no icon, no gap');
  });

  test('an alert with every slot empty keeps its padded box', async ({ page }) => {
    await mount(page, '<div style="inline-size: 300px"><line-alert>  </line-alert></div>');
    expect(await shownZones(page)).toEqual([]);
    const root = await box(page, 'root');
    expect({ width: root.width, height: root.height }).toEqual({ width: 300, height: 2 * INSET });
    expect((await box(page)).height).toBe(2 * INSET);
  });

  test("the message shows when its text changes in place from '' to text, and hides when it changes back (AM-001)", async ({
    page,
    browserName,
  }) => {
    await mount(page, '<line-alert><h3 slot="title">Upload</h3></line-alert>');
    const changes = await page.evaluate(async () => {
      const host = document.querySelector('main line-alert') as HTMLElement & { updateComplete: Promise<unknown> };
      const slot = host.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
      let slotchanges = 0;
      slot.addEventListener('slotchange', () => {
        slotchanges += 1;
      });
      const description = host.shadowRoot?.querySelector('[part="description"]') as HTMLElement;
      const shown = () => getComputedStyle(description).display !== 'none';
      // One task lets the slot and the mutation observer deliver their microtasks before the update is awaited.
      const settle = async () => {
        const task = Promise.withResolvers<void>();
        setTimeout(task.resolve);
        await task.promise;
        await host.updateComplete;
      };
      const text = document.createTextNode('');
      host.append(text);
      await settle();
      const appended = { shown: shown(), slotchanges };
      slotchanges = 0;
      text.data = 'All 12 files uploaded.';
      await settle();
      const filled = { shown: shown(), slotchanges };
      slotchanges = 0;
      text.nodeValue = '';
      await settle();
      const cleared = { shown: shown(), slotchanges };
      return { appended, filled, cleared };
    });
    // Chromium and Firefox fire no slotchange for a data change, as the DOM Standard says; WebKit fires one (AM-003).
    const perChange = browserName === 'webkit' ? 1 : 0;
    expect(changes).toEqual({
      appended: { shown: false, slotchanges: 1 },
      filled: { shown: true, slotchanges: perChange },
      cleared: { shown: false, slotchanges: perChange },
    });
  });

  test('text a wrapper forwards through its own slot shows and hides when it changes in place (AM-005)', async ({
    page,
  }) => {
    const states = await page.evaluate(async () => {
      if (!customElements.get('line-test-forwarder')) {
        customElements.define(
          'line-test-forwarder',
          class extends HTMLElement {
            constructor() {
              super();
              this.attachShadow({ mode: 'open' }).innerHTML = '<line-alert><slot></slot></line-alert>';
            }
          },
        );
      }
      const wrapper = document.createElement('line-test-forwarder');
      const text = document.createTextNode('');
      wrapper.append(text);
      document.querySelector('main')?.replaceChildren(wrapper);
      const host = wrapper.shadowRoot?.querySelector('line-alert') as HTMLElement & {
        updateComplete: Promise<unknown>;
      };
      const description = () => host.shadowRoot?.querySelector('[part="description"]') as HTMLElement;
      // One task lets the slots and the mutation observer deliver their microtasks before the update is awaited.
      const settle = async () => {
        const task = Promise.withResolvers<void>();
        setTimeout(task.resolve);
        await task.promise;
        await host.updateComplete;
      };
      const shown = () => getComputedStyle(description()).display !== 'none';
      await settle();
      const empty = shown();
      text.data = 'Forwarded message.';
      await settle();
      const filled = shown();
      text.data = '';
      await settle();
      const cleared = shown();
      return { empty, filled, cleared };
    });
    expect(states).toEqual({ empty: false, filled: true, cleared: false });
  });

  test('consumer CSS on line-alert and ::part() beats the :host rules', async ({ page }) => {
    await mount(
      page,
      `<style>
        line-alert.custom { --line-alert-bg: rgb(1, 2, 3); --line-alert-padding: 3px; margin-block: 7px; }
        line-alert.custom::part(root) { border-radius: 0; border-style: dashed; }
        line-alert.custom::part(title) { font-weight: 600; }
        line-alert.custom::part(actions) { justify-content: flex-end; }
      </style>
      <line-alert class="custom" variant="danger"><b slot="title">T</b>Text<button slot="actions">A</button></line-alert>`,
    );
    expect(
      await computed(page, ['background-color', 'padding-top', 'border-top-left-radius', 'border-top-style'], 'root'),
    ).toEqual({
      'background-color': 'rgb(1, 2, 3)',
      'padding-top': '3px',
      'border-top-left-radius': '0px',
      'border-top-style': 'dashed',
    });
    expect((await computed(page, ['font-weight'], 'title'))['font-weight']).toBe('600');
    expect((await computed(page, ['justify-content'], 'actions'))['justify-content']).toBe('flex-end');
    expect((await computed(page, ['margin-top']))['margin-top']).toBe('7px');
  });

  test('<line-alert hidden> renders nothing', async ({ page }) => {
    await mount(page, '<line-alert hidden>Text</line-alert>');
    expect((await computed(page, ['display'])).display).toBe('none');
    await expect(page.locator('main line-alert')).toBeHidden();
  });

  test('a slotted <button> keeps its focus and Enter/Space activation; the host takes no focus', async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      `<button id="before">Before</button>
      <line-alert id="a">Saved.<button slot="actions" id="undo">Undo</button></line-alert>`,
    );
    await page.evaluate(() => {
      const undo = document.getElementById('undo') as HTMLButtonElement;
      undo.dataset.clicks = '0';
      undo.addEventListener('click', () => {
        undo.dataset.clicks = String(Number(undo.dataset.clicks) + 1);
      });
    });
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#undo')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press(' ');
    await expect(page.locator('#undo')).toHaveAttribute('data-clicks', '2');
    const host = await page.evaluate(() => {
      const alert = document.getElementById('a') as HTMLElement;
      alert.focus();
      return { tabIndex: alert.tabIndex, focused: document.activeElement?.id };
    });
    expect(host).toEqual({ tabIndex: -1, focused: 'undo' });
  });

  for (const via of ['click', 'Enter', ' '] as const) {
    test(`the Dismiss recipe: line-dismiss, the alert hides, the handler moves focus (${via === ' ' ? 'Space' : via}) (AM-006)`, async ({
      page,
      browserName,
    }) => {
      await mount(
        page,
        `<h2 id="notices" tabindex="-1">Notices</h2>
        <line-alert id="features" variant="info">
          New features are available.
          <line-icon-button slot="dismiss" id="dismiss" aria-label="Dismiss notice"></line-icon-button>
        </line-alert>`,
      );
      await page.evaluate(() => {
        const notice = document.getElementById('features') as HTMLElement;
        notice.dataset.dismissals = '0';
        notice.addEventListener('line-dismiss', (event) => {
          const detail = (event as CustomEvent).detail;
          notice.dataset.dismissals = String(Number(notice.dataset.dismissals) + 1);
          notice.dataset.event = JSON.stringify([
            detail,
            event.bubbles,
            event.cancelable,
            event.composed,
            notice.hidden,
          ]);
          (document.getElementById('notices') as HTMLElement).focus();
        });
      });
      if (via === 'click') {
        await page.locator('#dismiss').click();
      } else {
        await page.locator('#notices').focus();
        await page.keyboard.press(tab(browserName));
        await expect(page.locator('#dismiss')).toBeFocused();
        await page.keyboard.press(via);
      }
      const notice = page.locator('#features');
      await expect(notice).toHaveAttribute('hidden', '');
      await expect(notice).toBeHidden();
      await expect(notice).toHaveAttribute('data-dismissals', '1');
      await expect(notice).toHaveAttribute('data-event', JSON.stringify([{}, true, true, false, false]));
      await expect(page.locator('#notices')).toBeFocused();
    });
  }

  test('a cancelled line-dismiss keeps the alert shown (AM-006)', async ({ page }) => {
    await mount(
      page,
      '<line-alert id="a">Saved.<button slot="dismiss" id="x" aria-label="Dismiss">x</button></line-alert>',
    );
    await page.evaluate(() => {
      document.getElementById('a')?.addEventListener('line-dismiss', (event) => event.preventDefault());
    });
    await page.locator('#x').click();
    await expect(page.locator('#a')).toBeVisible();
    await expect(page.locator('#a')).not.toHaveAttribute('hidden');
  });

  test('a disabled line-icon-button in the dismiss slot does not dismiss (AM-006)', async ({ page }) => {
    await mount(
      page,
      '<line-alert id="a">Saved.<line-icon-button slot="dismiss" id="x" aria-label="Dismiss" disabled></line-icon-button></line-alert>',
    );
    const fired = await page.evaluate(() => {
      const alert = document.getElementById('a') as HTMLElement;
      let count = 0;
      alert.addEventListener('line-dismiss', () => {
        count += 1;
      });
      (document.getElementById('x') as HTMLElement).click();
      return count;
    });
    await page.locator('#x').click({ force: true });
    expect(fired).toBe(0);
    await expect(page.locator('#a')).toBeVisible();
  });

  test('a click outside the dismiss slot does not dismiss (AM-006)', async ({ page }) => {
    await mount(
      page,
      '<line-alert id="a">Saved.<button slot="actions" id="undo">Undo</button><button slot="dismiss" aria-label="Dismiss">x</button></line-alert>',
    );
    await page.locator('#undo').click();
    await page.locator('#a').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#a')).toBeVisible();
  });

  test('a dismissed alert inserted again without hidden shows and dismisses again (AM-006)', async ({ page }) => {
    await mount(
      page,
      '<line-alert id="a">Saved.<button slot="dismiss" id="x" aria-label="Dismiss">x</button></line-alert>',
    );
    await page.locator('#x').click();
    await expect(page.locator('#a')).toBeHidden();
    await page.evaluate(async () => {
      const alert = document.getElementById('a') as HTMLElement & { updateComplete: Promise<unknown> };
      alert.remove();
      alert.removeAttribute('hidden');
      document.querySelector('main')?.append(alert);
      await alert.updateComplete;
    });
    await expect(page.locator('#a')).toBeVisible();
    expect(await shownZones(page, '#a')).toEqual(['description', 'dismiss']);
    await page.locator('#x').click();
    await expect(page.locator('#a')).toBeHidden();
  });

  test('the dismiss zone sits at the block start and inline end of row 1, mirrored under dir="rtl" (AM-006)', async ({
    page,
  }) => {
    const markup = FILLED.replace(
      '<button slot="actions"',
      '<button slot="dismiss" aria-label="Dismiss" style="inline-size: 24px; block-size: 24px"></button><button slot="actions"',
    );
    await mount(page, markup);
    let [root, content, actions, dismiss] = await Promise.all(
      ['root', 'content', 'actions', 'dismiss'].map((part) => box(page, part)),
    );
    expectNear(dismiss.right, root.right - INSET, 'dismiss at the inline end');
    expectNear(dismiss.top, root.top + INSET, 'dismiss at the block start');
    expectNear(content.right, dismiss.left - GAP, 'content before the gap and the dismiss zone');
    expectNear(actions.right, content.right, 'actions stay in the content column');
    expectNear(actions.top, content.bottom + GAP, 'actions in row 2');

    await mount(page, `<div dir="rtl">${markup}</div>`);
    [root, content, actions, dismiss] = await Promise.all(
      ['root', 'content', 'actions', 'dismiss'].map((part) => box(page, part)),
    );
    expectNear(dismiss.left, root.left + INSET, 'dismiss at the inline end, on the left');
    expectNear(dismiss.top, root.top + INSET, 'dismiss at the block start');
    expectNear(content.left, dismiss.right + GAP, 'content after the dismiss zone and the gap');

    await mount(page, FILLED);
    expect(await shownZones(page)).not.toContain('dismiss');
    expectNear((await box(page, 'content')).right, (await box(page, 'root')).right - INSET, 'no dismiss, no gap');
  });

  test('the internals hold the role of each live value; it is there synchronously after append() and a set', async ({
    page,
  }) => {
    await mount(
      page,
      `<line-alert></line-alert>
      <line-alert live="off"></line-alert>
      <line-alert live="loud"></line-alert>
      <line-alert live="polite"></line-alert>
      <line-alert live="assertive"></line-alert>`,
    );
    const values = await page.evaluate(async (url) => {
      // Runtime import in the page: the fixture module the page already loaded holds the one matching Symbol.
      const { INTERNALS } = (await import(url)) as { INTERNALS: symbol };
      const read = (el: Element) => {
        const internals = Reflect.get(el, INTERNALS) as ElementInternals | undefined;
        return internals
          ? { role: internals.role, ariaLive: internals.ariaLive, ariaAtomic: internals.ariaAtomic }
          : 'missing';
      };
      const mounted = [...document.querySelectorAll('main line-alert')].map(read);

      const created = document.createElement('line-alert') as HTMLElement & { live: string };
      created.setAttribute('live', 'assertive');
      const beforeAppend = read(created);
      document.querySelector('main')?.append(created);
      const afterAppend = read(created);
      created.live = 'polite';
      const afterSet = read(created);
      created.removeAttribute('live');
      const afterRemove = read(created);

      const holder = document.createElement('div');
      holder.innerHTML = '<line-alert live="polite"></line-alert>';
      const parsed = read(holder.firstElementChild as Element);
      return { mounted, beforeAppend, afterAppend, afterSet, afterRemove, parsed };
    }, `${FIXTURE_URL}fixture.ts`);
    const none = { role: null, ariaLive: null, ariaAtomic: null };
    const status = { ...none, role: 'status' };
    const alert = { ...none, role: 'alert' };
    expect(values).toEqual({
      mounted: [none, none, none, status, alert],
      beforeAppend: alert,
      afterAppend: alert,
      afterSet: status,
      afterRemove: none,
      parsed: status,
    });
  });
});

interface AXValue {
  value?: unknown;
}
interface AXNode {
  nodeId: string;
  ignored: boolean;
  role?: AXValue;
  name?: AXValue;
  properties?: { name: string; value: AXValue }[];
  childIds?: string[];
  backendDOMNodeId?: number;
}

/**
 * The accessibility tree Chromium builds, and the node of the element matched by `selector`. The node comes from
 * `getPartialAXTree`, which also returns an element the full tree prunes, such as a host with `role="none"`.
 */
async function axTree(cdp: CDPSession): Promise<{ nodes: Map<string, AXNode>; of(selector: string): Promise<AXNode> }> {
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  return {
    nodes: new Map(nodes.map((node) => [node.nodeId, node])),
    async of(selector) {
      const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      const partial = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
      return partial.nodes[0] as AXNode;
    },
  };
}

/** The live-region properties of an accessibility node, by name. */
function liveProperties(node: AXNode): Record<string, unknown> {
  return Object.fromEntries(
    (node.properties ?? [])
      .filter((property) => ['live', 'atomic', 'relevant', 'busy'].includes(property.name))
      .map((property) => [property.name, property.value.value]),
  );
}

/** Role and name of every node below `node`, as `role:name`. */
function descendants(nodes: Map<string, AXNode>, node: AXNode): string[] {
  const found: string[] = [];
  const queue = [...(node.childIds ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const child = nodes.get(id);
    if (!child) continue;
    if (!child.ignored) found.push(`${child.role?.value}:${child.name?.value ?? ''}`);
    queue.push(...(child.childIds ?? []));
  }
  return found;
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('live sets alert or status with their live properties; slotted content sits inside; author attributes win', async ({
    page,
  }) => {
    await open(page);
    const content = `<span slot="icon" role="img" aria-label="Error">!</span>
      <span slot="title">Payment failed</span>
      Check the card number.
      <button slot="actions">Retry</button>`;
    await mount(
      page,
      `<h1>Checkout</h1>
      <line-alert id="none">${content}</line-alert>
      <line-alert id="off" live="off">${content}</line-alert>
      <line-alert id="assertive" live="assertive">${content}</line-alert>
      <line-alert id="polite" live="polite">${content}</line-alert>
      <line-alert id="named" live="assertive" aria-label="Payment error">Text</line-alert>
      <line-alert id="role-none" live="assertive" role="none">Text</line-alert>
      <line-alert id="aria-live-off" live="assertive" aria-live="off">Text</line-alert>
      <line-alert id="dismissible" live="assertive">${content}<button slot="dismiss" aria-label="Dismiss notice">x</button></line-alert>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const tree = await axTree(cdp);

    for (const id of ['#none', '#off']) {
      const node = await tree.of(id);
      expect(['alert', 'status'], id).not.toContain(node.role?.value);
      expect(liveProperties(node), id).toEqual({});
    }

    const assertive = await tree.of('#assertive');
    expect(assertive.role?.value).toBe('alert');
    expect(assertive.name?.value ?? '').toBe('');
    expect(liveProperties(assertive)).toEqual({ live: 'assertive', atomic: true, relevant: 'additions text' });

    const polite = await tree.of('#polite');
    expect(polite.role?.value).toBe('status');
    expect(liveProperties(polite)).toEqual({ live: 'polite', atomic: true, relevant: 'additions text' });

    for (const region of [assertive, polite]) {
      const below = descendants(tree.nodes, region);
      expect(below).toContain('image:Error');
      expect(below).toContain('StaticText:Payment failed');
      expect(below).toContain('StaticText:Check the card number.');
      expect(below).toContain('button:Retry');
    }

    const named = await tree.of('#named');
    expect({ role: named.role?.value, name: named.name?.value }).toEqual({ role: 'alert', name: 'Payment error' });

    const roleNone = await tree.of('#role-none');
    expect(['alert', 'status']).not.toContain(roleNone.role?.value);
    expect(liveProperties(roleNone)).toEqual({});

    // A dismiss control leaves the region as it is, and sits inside it (AM-006).
    const dismissible = await tree.of('#dismissible');
    expect(dismissible.role?.value).toBe('alert');
    expect(liveProperties(dismissible)).toEqual(liveProperties(assertive));
    const inside = descendants(tree.nodes, dismissible);
    const base = descendants(tree.nodes, assertive);
    expect(base.filter((n) => !inside.includes(n))).toEqual([]);
    expect(inside.filter((n) => !(base.includes(n) || /Dismiss notice|:x$/.test(n)))).toEqual([]);
    expect(inside).toContain('button:Dismiss notice');

    const ariaLiveOff = await tree.of('#aria-live-off');
    expect(liveProperties(ariaLiveOff).live).toBeUndefined();
  });

  test('text changed in place on a live alert sits under the live node once the update completes (AM-005)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, '<line-alert id="changed" live="polite"></line-alert>');
    await page.evaluate(async () => {
      const host = document.getElementById('changed') as HTMLElement & { updateComplete: Promise<unknown> };
      const text = document.createTextNode('');
      host.append(text);
      const task = Promise.withResolvers<void>();
      setTimeout(task.resolve);
      await task.promise;
      text.data = 'All 12 files uploaded.';
      const next = Promise.withResolvers<void>();
      setTimeout(next.resolve);
      await next.promise;
      await host.updateComplete;
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const tree = await axTree(cdp);
    const node = await tree.of('#changed');
    expect(node.role?.value).toBe('status');
    expect(liveProperties(node)).toEqual({ live: 'polite', atomic: true, relevant: 'additions text' });
    expect(descendants(tree.nodes, node)).toContain('StaticText:All 12 files uploaded.');
  });

  test('an alert inserted after load is a live region at once', async ({ page }) => {
    await open(page);
    await mount(page, '<p>Before</p>');
    await page.evaluate(() => {
      const alert = document.createElement('line-alert');
      alert.setAttribute('live', 'assertive');
      alert.id = 'inserted';
      alert.textContent = 'Inserted alert text';
      document.querySelector('main')?.append(alert);
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const tree = await axTree(cdp);
    const node = await tree.of('#inserted');
    expect(node.role?.value).toBe('alert');
    expect(liveProperties(node)).toEqual({ live: 'assertive', atomic: true, relevant: 'additions text' });
    expect(descendants(tree.nodes, node)).toContain('StaticText:Inserted alert text');
  });

  test('the root border stays visible in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    // An opaque palette step, so the forced background is opaque Canvas; Chromium keeps the authored alpha.
    await mount(
      page,
      `<style>html { --line-red-3: rgb(250, 230, 230); --line-red-7: rgb(220, 120, 120); }</style>
      <line-alert variant="danger">Error: the payment failed.</line-alert>
      <div id="canvas" style="background-color: Canvas"></div>`,
    );
    const root = await computed(
      page,
      ['border-top-color', 'border-top-style', 'border-top-width', 'color', 'background-color'],
      'root',
    );
    const canvas = await page.evaluate(
      () => getComputedStyle(document.getElementById('canvas') as Element).backgroundColor,
    );
    expect(root['border-top-style']).toBe('solid');
    expect(root['border-top-width']).toBe('1px');
    expect(root['border-top-color']).toBe(root.color);
    expect(root['border-top-color']).not.toBe(canvas);
    expect(root['background-color']).toBe(canvas);
  });
});

test.describe('without line-themes (AM-002)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 'no-theme.html');
  });

  test('root has a transparent background, a currentColor border and the inherited text colour', async ({ page }) => {
    await mount(page, '<div style="color: rgb(200, 0, 0)"><line-alert variant="danger">Text</line-alert></div>');
    expect(
      await computed(
        page,
        ['background-color', 'border-top-color', 'border-top-style', 'border-top-width', 'color'],
        'root',
      ),
    ).toEqual({
      'background-color': 'rgba(0, 0, 0, 0)',
      'border-top-color': 'rgb(200, 0, 0)',
      'border-top-style': 'solid',
      'border-top-width': '1px',
      color: 'rgb(200, 0, 0)',
    });
  });
});
