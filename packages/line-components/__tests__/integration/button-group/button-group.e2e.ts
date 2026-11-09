/**
 * `<line-button-group>` browser tier (spec `0004-button-group.md` Tests, Browser row; Phase 1 spec §6.C.4,
 * §7.8; §10 SD39, SD99).
 *
 * Runs in chromium, firefox and webkit on the fixture page that the third `webServer` of
 * `playwright.config.ts` serves on port 4321. `index.html` loads the built `./button-group`, `./button` and
 * `./icon-button` with the radius and sizing tokens, and re-exports `INTERNALS` for the read-back. Each test
 * mounts its markup into `<main>`. One Tab stop, the arrow keys, focus-visible, focus recovery, `slotchange`
 * discovery, the corners and the internals proof live here, because happy-dom models none of them. The
 * Chromium accessibility tree is read through a CDP session in chromium only.
 *
 * @module __tests__/integration/button-group/button-group.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/button-group/';
const POSITION = 'data-line-button-group-position';

const THREE = `<line-button id="b1">Bold</line-button><line-button id="b2">Italic</line-button><line-button id="b3">Underline</line-button>`;

/** The group between two native buttons, so Tab has somewhere to come from and go to. */
function frame(attrs: string, items = THREE): string {
  return `<button id="before">Before</button><line-button-group id="g" aria-label="Text formatting" ${attrs}>${items}</line-button-group><button id="after">After</button>`;
}

test.beforeEach(async ({ page }) => {
  await page.goto(FIXTURE_URL);
  await page.evaluate(() =>
    Promise.all(['line-button-group', 'line-button', 'line-icon-button'].map((tag) => customElements.whenDefined(tag))),
  );
});

/** Yields a task twice: `slotchange`, the machine microtask and the host update all land before it resolves. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let i = 0; i < 2; i++) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 20);
      await promise;
    }
  });
}

/** Replaces the content of `<main>` and waits for the group to discover its buttons. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    await Promise.all(
      [...main.querySelectorAll('line-button-group, line-button, line-icon-button')].map(
        (el) => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
      ),
    );
  }, markup);
  await settle(page);
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

/**
 * Whether a pointer click focuses a button: WebKit on macOS focuses nothing on click, while WebKit on Linux, Chromium
 * and Firefox focus the clicked button (spec AM-009).
 */
function clickFocuses(browserName: string): boolean {
  return !(browserName === 'webkit' && process.platform === 'darwin');
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string, shift = false): string {
  const key = shift ? 'Shift+Tab' : 'Tab';
  return browserName === 'webkit' && process.platform === 'darwin' ? `Alt+${key}` : key;
}

/** `id:tabindex:position` of each child of the group, in order. */
function stops(page: Page): Promise<string[]> {
  return page.evaluate(
    (position) =>
      [...(document.getElementById('g')?.children ?? [])].map(
        (child) => `${child.id}:${child.getAttribute('tabindex')}:${child.getAttribute(position)}`,
      ),
    POSITION,
  );
}

function focusVisible(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => document.getElementById(id)?.hasAttribute('data-focus-visible') ?? false, id);
}

/** Tabs into the group from the button before it. */
async function enter(page: Page, browserName: string): Promise<void> {
  await page.focus('#before');
  await page.keyboard.press(tab(browserName));
}

test.describe('one Tab stop (decisions D3, D5)', () => {
  test('Tab enters once and leaves; Shift+Tab returns to the remembered button', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    expect(await focusPath(page)).toBe('b1>button');
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('after');
    await page.keyboard.press(tab(browserName, true));
    expect(await focusPath(page)).toBe('b1>button');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('after');
    await page.keyboard.press(tab(browserName, true));
    expect(await focusPath(page)).toBe('b2>button');
    await page.keyboard.press(tab(browserName, true));
    expect(await focusPath(page)).toBe('before');
  });

  test('Tab lands on the first enabled button when the first is disabled; loading buttons stay reachable', async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      frame(
        '',
        `<line-button id="b1" disabled>Bold</line-button><line-button id="b2" loading>Italic</line-button><line-button id="b3">Underline</line-button>`,
      ),
    );
    await enter(page, browserName);
    expect(await focusPath(page)).toBe('b2>button');
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('after');
  });

  test('a button that turns disabled after mount hands over the Tab stop', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await page.evaluate(() => document.getElementById('b1')?.setAttribute('disabled', ''));
    await settle(page);
    await enter(page, browserName);
    expect(await focusPath(page)).toBe('b2>button');
  });
});

test.describe('arrow keys, Home and End (decisions D4, D5)', () => {
  const ITEMS4 = `${THREE}<line-button id="b4">Strike</line-button>`;

  async function sequence(page: Page, keys: string[]): Promise<string[]> {
    const seen: string[] = [];
    for (const key of keys) {
      await page.keyboard.press(key);
      seen.push(await focusPath(page));
    }
    return seen;
  }

  test('horizontal: Right and Left move, Home and End jump, no wrap, Up and Down pass through', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame('', ITEMS4));
    await page.evaluate(() => {
      const prevented: string[] = [];
      Object.assign(window, { prevented });
      document.addEventListener('keydown', (event) => prevented.push(`${event.key}:${event.defaultPrevented}`));
    });
    await enter(page, browserName);
    expect(
      await sequence(page, [
        'ArrowRight',
        'ArrowRight',
        'ArrowDown',
        'ArrowLeft',
        'End',
        'ArrowRight',
        'Home',
        'ArrowLeft',
      ]),
    ).toEqual(['b2>button', 'b3>button', 'b3>button', 'b2>button', 'b4>button', 'b4>button', 'b1>button', 'b1>button']);
    // Handled keys are prevented, so they never scroll the page; ArrowDown passes through to the browser.
    expect(
      (await page.evaluate(() => Reflect.get(window, 'prevented') as string[])).filter(
        (k) => !(k.startsWith('Tab') || k.startsWith('Alt')),
      ),
    ).toEqual([
      'ArrowRight:true',
      'ArrowRight:true',
      'ArrowDown:false',
      'ArrowLeft:true',
      'End:true',
      'ArrowRight:true',
      'Home:true',
      'ArrowLeft:true',
    ]);
  });

  test('loop wraps at both ends', async ({ page, browserName }) => {
    await mount(page, frame('loop', ITEMS4));
    await enter(page, browserName);
    expect(await sequence(page, ['ArrowLeft', 'ArrowRight'])).toEqual(['b4>button', 'b1>button']);
  });

  test('vertical: Down and Up move; Right passes through', async ({ page, browserName }) => {
    await mount(page, frame('orientation="vertical"', ITEMS4));
    await enter(page, browserName);
    expect(await sequence(page, ['ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'End', 'Home'])).toEqual([
      'b2>button',
      'b2>button',
      'b3>button',
      'b2>button',
      'b4>button',
      'b1>button',
    ]);
  });

  test('right-to-left: Left moves to the next button', async ({ page, browserName }) => {
    await mount(page, frame('dir="rtl"', ITEMS4));
    await enter(page, browserName);
    expect(await sequence(page, ['ArrowLeft', 'ArrowLeft', 'ArrowRight'])).toEqual([
      'b2>button',
      'b3>button',
      'b2>button',
    ]);
  });

  test('the arrows skip disabled and hidden buttons and keep loading ones; line-icon-button hosts are items', async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      frame(
        '',
        `<line-button id="b1">Bold</line-button><line-button id="b2" disabled>Italic</line-button><line-button id="h" hidden>Hidden</line-button><line-icon-button id="i3" aria-label="Code"></line-icon-button><line-button id="b4" loading>Strike</line-button>`,
      ),
    );
    await enter(page, browserName);
    expect(await sequence(page, ['ArrowRight', 'ArrowRight', 'ArrowLeft'])).toEqual([
      'i3>button',
      'b4>button',
      'i3>button',
    ]);
  });

  test('a key with a modifier moves no focus and is not prevented (decision D18)', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await page.evaluate(() => {
      const prevented: string[] = [];
      Object.assign(window, { prevented });
      document.addEventListener('keydown', (event) => {
        if (event.defaultPrevented) prevented.push(event.key);
      });
    });
    await enter(page, browserName);
    for (const key of [
      'Alt+ArrowRight',
      'Control+ArrowRight',
      'Meta+ArrowRight',
      'Shift+ArrowRight',
      'Control+End',
      'Shift+Home',
    ]) {
      await page.keyboard.press(key);
      expect(await focusPath(page), key).toBe('b1>button');
    }
    expect(await page.evaluate(() => Reflect.get(window, 'prevented'))).toEqual([]);
    await page.keyboard.press('ArrowRight');
    expect(await focusPath(page)).toBe('b2>button');
    expect(await page.evaluate(() => Reflect.get(window, 'prevented'))).toEqual(['ArrowRight']);
  });

  test('Enter and Space still activate the focused button', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await page.evaluate(() => {
      const clicks: string[] = [];
      Object.assign(window, { clicks });
      document.addEventListener('click', (event) => clicks.push((event.target as Element).id));
    });
    await enter(page, browserName);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await settle(page);
    expect(await page.evaluate(() => Reflect.get(window, 'clicks'))).toEqual(['b2', 'b2']);
  });
});

test.describe('focus-visible (decision D3)', () => {
  test('a keyboard move shows the ring on the new button', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    expect(await focusVisible(page, 'b1')).toBe(true);
    await page.keyboard.press('ArrowRight');
    expect(await focusVisible(page, 'b1')).toBe(false);
    expect(await focusVisible(page, 'b2')).toBe(true);
  });

  test('a keyboard move after a pointer click shows the ring (Firefox needs focusVisible: true)', async ({
    page,
    browserName,
  }) => {
    test.skip(!clickFocuses(browserName), 'WebKit on macOS does not focus a button on click (spec probe P1, AM-009)');
    await mount(page, frame(''));
    await page.click('#b1');
    expect(await focusPath(page)).toBe('b1>button');
    expect(await focusVisible(page, 'b1')).toBe(false);
    await page.keyboard.press('ArrowRight');
    expect(await focusPath(page)).toBe('b2>button');
    expect(await focusVisible(page, 'b2')).toBe(true);
  });

  test('a pointer click moves the remembered button, except in WebKit on macOS, where a click focuses nothing (probe P1, AM-009)', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame(''));
    await page.click('#b3');
    if (!clickFocuses(browserName)) {
      expect(await focusPath(page)).toBe('body');
      expect(await stops(page)).toEqual(['b1:0:first', 'b2:-1:middle', 'b3:-1:last']);
    } else {
      expect(await focusPath(page)).toBe('b3>button');
      expect(await stops(page)).toEqual(['b1:-1:first', 'b2:-1:middle', 'b3:0:last']);
    }
    await enter(page, browserName);
    expect(await focusPath(page)).toBe(clickFocuses(browserName) ? 'b3>button' : 'b1>button');
  });

  test('the focused button is raised above its neighbours', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    const zIndex = await page.evaluate(() => getComputedStyle(document.getElementById('b1') as Element).zIndex);
    expect(zIndex).toBe('1');
  });
});

test.describe('focus recovery (decisions D12, D13, D16)', () => {
  /** Records the `focusout` events that reach the group with no `relatedTarget`. */
  async function recordFocusOut(page: Page): Promise<void> {
    await page.evaluate(() => {
      const seen: string[] = [];
      Object.assign(window, { focusOuts: seen });
      document.getElementById('g')?.addEventListener('focusout', (event) => {
        if (!event.relatedTarget) seen.push((event.target as Element).id);
      });
    });
  }

  test('a focused button that turns disabled hands focus to the next enabled button, with the ring', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame(''));
    await recordFocusOut(page);
    await enter(page, browserName);
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => document.getElementById('b2')?.setAttribute('disabled', ''));
    await settle(page);
    expect(await focusPath(page)).toBe('b3>button');
    expect(await focusVisible(page, 'b3')).toBe(true);
    // Every engine fires `focusout` with no `relatedTarget` on the button that turned disabled.
    expect(await page.evaluate(() => Reflect.get(window, 'focusOuts'))).toEqual(['b2']);
  });

  test('the last button turning disabled hands focus to the previous enabled one', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    await page.keyboard.press('End');
    await page.evaluate(() => document.getElementById('b3')?.setAttribute('disabled', ''));
    await settle(page);
    expect(await focusPath(page)).toBe('b2>button');
    expect(await stops(page)).toEqual(['b1:-1:first', 'b2:0:middle', 'b3:-1:last']);
  });

  test('a removed focused button hands focus to the next enabled one, else the previous', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => document.getElementById('b2')?.remove());
    await settle(page);
    expect(await focusPath(page)).toBe('b3>button');
    expect(await focusVisible(page, 'b3')).toBe(true);
    await page.evaluate(() => document.getElementById('b3')?.remove());
    await settle(page);
    expect(await focusPath(page)).toBe('b1>button');
    expect(await stops(page)).toEqual(['b1:0:only']);
  });

  test('a focused button that turns hidden hands focus on and stops being an item', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => document.getElementById('b2')?.setAttribute('hidden', ''));
    await settle(page);
    expect(await focusPath(page)).toBe('b3>button');
    expect(await focusVisible(page, 'b3')).toBe(true);
    expect(await stops(page)).toEqual(['b1:-1:first', 'b2:null:null', 'b3:0:last']);
  });

  test('the last button turning hidden hands focus to the previous one, with the ring', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    await page.keyboard.press('End');
    await page.evaluate(() => document.getElementById('b3')?.setAttribute('hidden', ''));
    await settle(page);
    expect(await focusPath(page)).toBe('b2>button');
    expect(await focusVisible(page, 'b2')).toBe(true);
    expect(await stops(page)).toEqual(['b1:-1:first', 'b2:0:last', 'b3:null:null']);
  });

  test('a second refresh before the browser drops focus keeps the recovery (finding F5)', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame('', `${THREE}<line-button id="b4">Strike</line-button>`));
    await enter(page, browserName);
    await page.keyboard.press('ArrowRight');
    await page.evaluate(async () => {
      document.getElementById('b2')?.setAttribute('disabled', '');
      // Let the observer, the machine and the host update run, then change another button in the same task.
      for (let i = 0; i < 10; i++) await Promise.resolve();
      document.getElementById('b4')?.setAttribute('disabled', '');
    });
    await settle(page);
    expect(await focusPath(page)).toBe('b3>button');
  });

  test('a blur to nowhere keeps the focus where the user put it', async ({ page, browserName }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.evaluate(() => document.getElementById('b3')?.remove());
    await settle(page);
    expect(await focusPath(page)).toBe('body');
  });
});

test.describe('slotchange discovery and the attributes the group writes (decisions D2, D14, D16)', () => {
  test('append, remove and reorder recompute positions; the tab stop follows the active element', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => {
      const group = document.getElementById('g') as HTMLElement;
      const b4 = document.createElement('line-button');
      b4.id = 'b4';
      b4.textContent = 'Strike';
      group.append(b4);
      group.insertBefore(document.getElementById('b2') as HTMLElement, document.getElementById('b1'));
    });
    await settle(page);
    expect(await stops(page)).toEqual(['b2:0:first', 'b1:-1:middle', 'b3:-1:middle', 'b4:-1:last']);
  });

  test('an element that leaves the group loses the tabindex and position the group wrote', async ({ page }) => {
    await mount(page, frame(''));
    await page.evaluate(() => document.querySelector('main')?.append(document.getElementById('b1') as HTMLElement));
    await settle(page);
    const left = await page.evaluate((position) => {
      const b1 = document.getElementById('b1') as HTMLElement;
      return [b1.getAttribute('tabindex'), b1.getAttribute(position)];
    }, POSITION);
    expect(left).toEqual([null, null]);
    expect(await stops(page)).toEqual(['b2:0:first', 'b3:-1:last']);
  });

  test('non-button children and hidden buttons get no attributes; a native button keeps its own Tab stop', async ({
    page,
    browserName,
  }) => {
    await mount(
      page,
      frame(
        '',
        `<span id="s0">Zoom</span><line-button id="h0" hidden>Hidden</line-button><line-button id="b1">Bold</line-button><line-separator id="sep" orientation="vertical"></line-separator><line-button id="b2">Italic</line-button><line-button id="b3">Underline</line-button><button id="n4">Native</button>`,
      ),
    );
    expect(await stops(page)).toEqual([
      's0:null:null',
      'h0:null:null',
      'b1:0:first',
      'sep:null:null',
      'b2:-1:middle',
      'b3:-1:last',
      'n4:null:null',
    ]);
    await enter(page, browserName);
    expect(await focusPath(page)).toBe('b1>button');
    // The arrow keys pass over the separator, which is not an item.
    await page.keyboard.press('ArrowRight');
    expect(await focusPath(page)).toBe('b2>button');
    await page.keyboard.press(tab(browserName));
    expect(await focusPath(page)).toBe('n4');
  });

  test('hidden turns fire no slotchange; the observer drops and restores the button', async ({ page }) => {
    await mount(page, frame(''));
    await page.evaluate(() => {
      const counter = { slotchanges: 0 };
      Object.assign(window, { counter });
      document
        .getElementById('g')
        ?.shadowRoot?.querySelector('slot')
        ?.addEventListener('slotchange', () => {
          counter.slotchanges++;
        });
      document.getElementById('b3')?.setAttribute('hidden', '');
    });
    await settle(page);
    expect(await stops(page)).toEqual(['b1:0:first', 'b2:-1:last', 'b3:null:null']);
    await page.evaluate(() => document.getElementById('b3')?.removeAttribute('hidden'));
    await settle(page);
    expect(await stops(page)).toEqual(['b1:0:first', 'b2:-1:middle', 'b3:-1:last']);
    expect(await page.evaluate(() => Reflect.get(Reflect.get(window, 'counter'), 'slotchanges'))).toBe(0);
  });

  test('a reconnected group re-reads its buttons, keeps the tab stop and re-arms its observer', async ({
    page,
    browserName,
  }) => {
    await mount(page, frame(''));
    await enter(page, browserName);
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => {
      const group = document.getElementById('g') as HTMLElement;
      const after = document.getElementById('after') as HTMLElement;
      group.remove();
      after.before(group);
    });
    await settle(page);
    expect(await stops(page)).toEqual(['b1:-1:first', 'b2:0:middle', 'b3:-1:last']);
    await enter(page, browserName);
    expect(await focusPath(page)).toBe('b2>button');
    await page.keyboard.press('ArrowRight');
    expect(await focusPath(page)).toBe('b3>button');
    await page.evaluate(() => document.getElementById('b1')?.setAttribute('hidden', ''));
    await settle(page);
    expect(await stops(page)).toEqual(['b1:null:null', 'b2:-1:first', 'b3:0:last']);
  });

  test('the group itself takes no focus', async ({ page }) => {
    await mount(page, frame(''));
    await page.focus('#before');
    await page.evaluate(() => document.getElementById('g')?.focus());
    expect(await focusPath(page)).toBe('before');
  });
});

test.describe('corners (decisions D9, D14, D15, D16)', () => {
  /** The four corner radii of each item's `root` part, top-left first, clockwise. */
  function corners(page: Page, ids: string[]): Promise<Record<string, string>> {
    return page.evaluate(
      (ids) =>
        Object.fromEntries(
          ids.map((id) => {
            const root = document.getElementById(id)?.shadowRoot?.querySelector('[part="root"]') as Element;
            const style = getComputedStyle(root);
            return [
              id,
              `${style.borderTopLeftRadius} ${style.borderTopRightRadius} ${style.borderBottomRightRadius} ${style.borderBottomLeftRadius}`,
            ];
          }),
        ),
      ids,
    );
  }

  const MIXED = `<span id="s0">Zoom</span><line-button id="h0" hidden>Hidden</line-button><line-icon-button id="i1" aria-label="Zoom out"></line-icon-button><line-button id="b2">100%</line-button><line-icon-button id="i3" aria-label="Zoom in"></line-icon-button><line-button id="h4" hidden>Hidden</line-button><span id="s5">end</span>`;

  test('horizontal: outer corners on the first and last visible buttons, square between', async ({ page }) => {
    await mount(page, frame('', MIXED));
    expect(await corners(page, ['i1', 'b2', 'i3'])).toEqual({
      i1: '5px 0px 0px 5px',
      b2: '0px 0px 0px 0px',
      i3: '0px 5px 5px 0px',
    });
  });

  test('right-to-left mirrors the outer corners', async ({ page }) => {
    await mount(page, frame('dir="rtl"', MIXED));
    expect(await corners(page, ['i1', 'b2', 'i3'])).toEqual({
      i1: '0px 5px 5px 0px',
      b2: '0px 0px 0px 0px',
      i3: '5px 0px 0px 5px',
    });
  });

  test('vertical: top corners on the first button, bottom corners on the last', async ({ page }) => {
    await mount(page, frame('orientation="vertical"', MIXED));
    expect(await corners(page, ['i1', 'b2', 'i3'])).toEqual({
      i1: '5px 5px 0px 0px',
      b2: '0px 0px 0px 0px',
      i3: '0px 0px 5px 5px',
    });
  });

  test('a page rule on the button radius token wins over the group corners (spec probe P8)', async ({ page }) => {
    await page.addStyleTag({ content: 'line-button { --line-button-radius: 9px; }' });
    await mount(page, frame(''));
    expect(await corners(page, ['b1', 'b2', 'b3'])).toEqual({
      b1: '9px 9px 9px 9px',
      b2: '9px 9px 9px 9px',
      b3: '9px 9px 9px 9px',
    });
  });

  test('a single button keeps all four corners; --line-button-group-radius sets them', async ({ page }) => {
    await mount(page, frame('style="--line-button-group-radius: 7px"', `<line-button id="b1">Only</line-button>`));
    expect(await corners(page, ['b1'])).toEqual({ b1: '7px 7px 7px 7px' });
  });
});

test.describe('widths (decision D19; 0002-button.md AM-010; 0003-icon-button.md AM-004)', () => {
  /** The rendered inline size of each item's `root` part, in px. */
  function rootWidths(page: Page, ids: string[]): Promise<number[]> {
    return page.evaluate(
      (ids) =>
        ids.map((id) => {
          const root = document.getElementById(id)?.shadowRoot?.querySelector('[part="root"]');
          return root ? Math.round(root.getBoundingClientRect().width) : -1;
        }),
      ids,
    );
  }

  test('in a vertical group every root is as wide as the widest', async ({ page }) => {
    await mount(
      page,
      frame(
        'orientation="vertical"',
        `<line-button id="b1">Select</line-button><line-button id="b2">Crop</line-button><line-button id="b3">Export</line-button><line-icon-button id="i4" aria-label="More"></line-icon-button>`,
      ),
    );
    const widths = await rootWidths(page, ['b1', 'b2', 'b3', 'i4']);
    const hosts = await page.evaluate(() =>
      ['b1', 'b2', 'b3'].map((id) =>
        Math.round((document.getElementById(id) as Element).getBoundingClientRect().width),
      ),
    );
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]).toBe(Math.max(...hosts));
  });

  test('a standalone button and icon button keep their content width', async ({ page }) => {
    await mount(
      page,
      `<div style="display: block"><line-button id="s1">Export</line-button></div><div><line-icon-button id="s2" aria-label="More"></line-icon-button></div>`,
    );
    const content = await page.evaluate(() => {
      const root = document.getElementById('s1')?.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
      const style = getComputedStyle(root);
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('s1') as Node);
      return Math.round(
        range.getBoundingClientRect().width +
          Number.parseFloat(style.paddingLeft) +
          Number.parseFloat(style.paddingRight),
      );
    });
    const [button, iconButton] = await rootWidths(page, ['s1', 's2']);
    expect(Math.abs((button ?? 0) - content)).toBeLessThanOrEqual(1);
    expect(iconButton).toBe(32);
  });

  test('a consumer width on the host reaches the root', async ({ page }) => {
    await page.addStyleTag({ content: 'line-button, line-icon-button { inline-size: 200px; }' });
    await mount(
      page,
      `<line-button id="s1">Export</line-button><line-icon-button id="s2" aria-label="More"></line-icon-button>`,
    );
    expect(await rootWidths(page, ['s1', 's2'])).toEqual([200, 200]);
  });
});

test.describe('internals proof (Phase 1 spec §6.C.4; §10 SD39; decision D1)', () => {
  test('INTERNALS reads back role toolbar, and ariaOrientation vertical only while vertical', async ({ page }) => {
    await mount(
      page,
      `<line-button-group id="h" aria-label="A">${THREE}</line-button-group><line-button-group id="v" orientation="vertical" aria-label="B"></line-button-group>`,
    );
    const values = await page.evaluate(async (url) => {
      const { INTERNALS } = (await import(url)) as { INTERNALS: symbol };
      return [...document.querySelectorAll('main line-button-group')].map((el) => {
        const internals = Reflect.get(el, INTERNALS) as ElementInternals | undefined;
        return internals ? { role: internals.role, ariaOrientation: internals.ariaOrientation } : 'missing';
      });
    }, `${FIXTURE_URL}fixture.ts`);
    expect(values).toEqual([
      { role: 'toolbar', ariaOrientation: null },
      { role: 'toolbar', ariaOrientation: 'vertical' },
    ]);
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
}

/** The accessibility node Chromium builds for the element matched by `selector`. */
async function axNode(cdp: CDPSession, selector: string): Promise<AXNode> {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes[0] as AXNode;
}

const orientationOf = (node: AXNode): unknown =>
  node.properties?.find((property) => property.name === 'orientation')?.value.value;

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('role, name and orientation come from the internals and the host; author attributes win', async ({ page }) => {
    await mount(
      page,
      `<span id="lbl">Formatting</span>
      <line-button-group id="horizontal" aria-label="Text formatting">${THREE}</line-button-group>
      <line-button-group id="vertical" orientation="vertical" aria-label="Tools"><line-button>Select</line-button></line-button-group>
      <line-button-group id="labelledby" aria-labelledby="lbl"><line-button>Bold</line-button></line-button-group>
      <line-button-group id="unnamed"><line-button>Bold</line-button></line-button-group>
      <line-button-group id="author-orientation" aria-orientation="vertical" aria-label="X"><line-button>A</line-button></line-button-group>
      <line-button-group id="author-role" role="group" aria-label="Y"><line-button>A</line-button></line-button-group>`,
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');

    const horizontal = await axNode(cdp, '#horizontal');
    expect([horizontal.role?.value, horizontal.name?.value]).toEqual(['toolbar', 'Text formatting']);
    // Chromium reports the ARIA default for a toolbar whose internals orientation is null (spec AM-002).
    expect(orientationOf(horizontal)).toBe('horizontal');

    const vertical = await axNode(cdp, '#vertical');
    expect([vertical.role?.value, vertical.name?.value, orientationOf(vertical)]).toEqual([
      'toolbar',
      'Tools',
      'vertical',
    ]);

    const labelledBy = await axNode(cdp, '#labelledby');
    expect([labelledBy.role?.value, labelledBy.name?.value]).toEqual(['toolbar', 'Formatting']);

    const unnamed = await axNode(cdp, '#unnamed');
    expect([unnamed.role?.value, unnamed.name?.value ?? '']).toEqual(['toolbar', '']);

    expect(orientationOf(await axNode(cdp, '#author-orientation'))).toBe('vertical');
    expect((await axNode(cdp, '#author-role')).role?.value).toBe('group');

    // The buttons are the toolbar's descendants in the accessibility tree.
    const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as {
      nodes: (AXNode & { parentId?: string; childIds?: string[] })[];
    };
    const byId = new Map(nodes.map((node) => [node.nodeId, node]));
    const toolbar = nodes.find((node) => node.role?.value === 'toolbar' && node.name?.value === 'Text formatting');
    const buttons: unknown[] = [];
    const walk = (id: string): void => {
      const node = byId.get(id);
      if (!node) return;
      if (!node.ignored && node.role?.value === 'button') buttons.push(node.name?.value);
      for (const child of node.childIds ?? []) walk(child);
    };
    walk(toolbar?.nodeId ?? '');
    expect(buttons).toEqual(['Bold', 'Italic', 'Underline']);
  });
});
