/**
 * `<line-portal>` browser tier (spec `0013-portal.md` Tests, Browser row; Phase 1 spec §7.8, §6.C.4 notes, §12
 * AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `./portal` subpath; each test mounts its markup into `<main>`.
 * `pre-upgrade.html` loads `./portal` only when the test asks, so the content can be measured before the upgrade (P6;
 * D8). Order is read with Playwright's `ariaSnapshot()` in every engine and through a CDP session in chromium only
 * (D13); the component writes no internals value, so nothing is read back through `INTERNALS`.
 *
 * @module __tests__/integration/portal/portal.e2e
 */

import { expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/portal/';

type PortalElement = HTMLElement & { disabled: boolean; bringToFront(): void; updateComplete: Promise<unknown> };

async function open(page: Page): Promise<void> {
  await page.goto(FIXTURE_URL);
  await page.evaluate(() => customElements.whenDefined('line-portal'));
}

/** Replaces the content of `<main>` and waits for every `line-portal` to render and paint. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...document.querySelectorAll('line-portal')].map(
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

/** Whether the root of the `line-portal` matched by `selector` is in the top layer. */
function isOpen(page: Page, selector: string): Promise<boolean> {
  return page.evaluate(
    (sel) =>
      (document.querySelector(sel) as HTMLElement).shadowRoot
        ?.querySelector('[part="root"]')
        ?.matches(':popover-open') ?? false,
    selector,
  );
}

/** The border box of the root of the `line-portal` matched by `selector`. */
function rootBox(page: Page, selector: string): Promise<{ x: number; y: number; width: number; height: number }> {
  return page.evaluate((sel) => {
    const root = (document.querySelector(sel) as HTMLElement).shadowRoot?.querySelector('[part="root"]') as HTMLElement;
    const { x, y, width, height } = root.getBoundingClientRect();
    return { x, y, width, height };
  }, selector);
}

/** The id of the element `elementFromPoint` returns at the centre of the element matched by `selector`. */
function hitAtCentre(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const { x, y, width, height } = (document.querySelector(sel) as HTMLElement).getBoundingClientRect();
    const hit = document.elementFromPoint(x + width / 2, y + height / 2);
    return hit?.id || hit?.localName || '';
  }, selector);
}

/** The inline-start offset of the element matched by `selector`. */
function left(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => (document.querySelector(sel) as HTMLElement).getBoundingClientRect().left, selector);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

/** The probe P1 page: a cover, then a clipping, transformed trap inside `dir`, `lang` and theme scopes and a form. */
const TRAP = `
  <style>
    #cover { position: fixed; inset-block-start: 80px; inset-inline-start: 280px; inline-size: 240px; block-size: 120px; z-index: 2; background: rgb(255, 255, 255); }
    #trap { position: relative; overflow: hidden; transform: translateZ(0); z-index: 1; inline-size: 200px; block-size: 40px; --line-probe: rgb(1, 2, 3); }
    [data-accent='ruby'] { --line-accent-probe: rgb(200, 0, 0); }
    #content { color: var(--line-probe); background-color: var(--line-accent-probe); }
    #p::part(root):popover-open { inset-block-start: 100px; inset-inline-start: 300px; }
  </style>
  <div id="cover"></div>
  <div id="app" dir="rtl" lang="pt" data-accent="ruby">
    <form id="f">
      <button type="button" id="before">Before</button>
      <div id="trap">
        <line-portal id="p">
          <div id="content"><button type="button" id="inner">Inner</button><input name="q" value="1" aria-label="Query" /> Portal text</div>
        </line-portal>
      </div>
      <button type="button" id="after">After</button>
    </form>
  </div>
`;

test.describe('on the P1 trap', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
    await mount(page, TRAP);
  });

  test('the content is hit at its centre above a transformed overflow: hidden ancestor and a z-index sibling (P1)', async ({
    page,
  }) => {
    expect(await isOpen(page, '#p')).toBe(true);
    const box = await page.evaluate(() => (document.getElementById('inner') as HTMLElement).getBoundingClientRect());
    // The box sits at the consumer point, outside the 200 × 40 trap and over the cover.
    expect(box.top).toBeGreaterThanOrEqual(99);
    expect(await hitAtCentre(page, '#inner')).toBe('inner');
  });

  test('the content keeps dir, lang, the theme scope and an inherited custom property (P2)', async ({ page }) => {
    const context = await page.evaluate(() => {
      const content = document.getElementById('content') as HTMLElement;
      const style = getComputedStyle(content);
      return {
        dir: content.matches(':dir(rtl)'),
        lang: content.matches(':lang(pt)'),
        probe: style.getPropertyValue('--line-probe').trim(),
        color: style.color,
        accent: style.backgroundColor,
      };
    });
    expect(context).toEqual({
      dir: true,
      lang: true,
      probe: 'rgb(1, 2, 3)',
      color: 'rgb(1, 2, 3)',
      accent: 'rgb(200, 0, 0)',
    });
  });

  test('a click on the content reaches the host and its ancestors; a slotted control keeps its form (P3)', async ({
    page,
  }) => {
    await page.evaluate(() => {
      const record: string[] = [];
      (window as unknown as { reached: string[] }).reached = record;
      for (const target of [
        document.getElementById('p'),
        document.getElementById('trap'),
        document.getElementById('app'),
        document,
      ]) {
        target?.addEventListener('click', () =>
          record.push(target === document ? 'document' : (target as HTMLElement).id),
        );
      }
    });
    await page.locator('#inner').click();
    expect(await page.evaluate(() => (window as unknown as { reached: string[] }).reached)).toEqual([
      'p',
      'trap',
      'app',
      'document',
    ]);
    const form = await page.evaluate(() => {
      const f = document.getElementById('f') as HTMLFormElement;
      const field = f.querySelector('input[name="q"]') as HTMLInputElement;
      const submitted = Promise.withResolvers<string | null>();
      f.addEventListener('submit', (event) => {
        event.preventDefault();
        submitted.resolve(new FormData(f).get('q') as string | null);
      });
      f.requestSubmit();
      return submitted.promise.then((q) => ({ owner: field.form?.id, q }));
    });
    expect(form).toEqual({ owner: 'f', q: '1' });
  });

  test('Tab from the control before the host reaches the content next (P4)', async ({ page, browserName }) => {
    await page.locator('#before').focus();
    const order: string[] = [];
    for (let step = 0; step < 3; step++) {
      await page.keyboard.press(tab(browserName));
      order.push(
        await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute('name') || ''),
      );
    }
    expect(order).toEqual(['inner', 'q', 'after']);
  });

  test('ariaSnapshot() lists the content between its neighbours (P4; D13)', async ({ page }) => {
    const snapshot = await page.locator('#f').ariaSnapshot();
    const at = (needle: string) => snapshot.indexOf(needle);
    expect(at('button "Before"')).toBeGreaterThanOrEqual(0);
    expect(at('button "Before"')).toBeLessThan(at('button "Inner"'));
    expect(at('button "Inner"')).toBeLessThan(at('textbox "Query"'));
    expect(at('textbox "Query"')).toBeLessThan(at('Portal text'));
    expect(at('Portal text')).toBeLessThan(at('button "After"'));
  });

  test('the Chromium accessibility tree lists the content between its neighbours (P4; D13)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    interface AXNode {
      nodeId: string;
      ignored: boolean;
      role?: { value: string };
      name?: { value: string };
      childIds?: string[];
    }
    const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
    const byId = new Map(nodes.map((each) => [each.nodeId, each]));
    const names: string[] = [];
    // Depth-first, in tree order: the controls, and the content's own text.
    const kept = (node: AXNode): boolean => {
      if (node.ignored) return false;
      const role = node.role?.value;
      return (
        role === 'button' || role === 'textbox' || (role === 'StaticText' && node.name?.value.trim() === 'Portal text')
      );
    };
    const walk = (node: AXNode | undefined): void => {
      if (!node) return;
      if (kept(node)) names.push(node.name?.value.trim() ?? '');
      for (const id of node.childIds ?? []) walk(byId.get(id));
    };
    walk(nodes[0]);
    expect(names).toEqual(['Before', 'Inner', 'Query', 'Portal text', 'After']);
  });

  test('removing and appending the host closes and shows the box; a child added later shows (P5)', async ({ page }) => {
    const states = await page.evaluate(async () => {
      const trap = document.getElementById('trap') as HTMLElement;
      const host = document.getElementById('p') as PortalElement;
      const root = host.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
      host.remove();
      const removed = root.matches(':popover-open');
      trap.append(host);
      await host.updateComplete;
      const appended = root.matches(':popover-open');
      const late = document.createElement('button');
      late.type = 'button';
      late.id = 'late';
      late.textContent = 'Late';
      host.append(late);
      return { removed, appended };
    });
    expect(states).toEqual({ removed: false, appended: true });
    expect(await hitAtCentre(page, '#inner')).toBe('inner');
    expect(await page.evaluate(() => (document.getElementById('late') as HTMLElement).checkVisibility())).toBe(true);
    expect(await hitAtCentre(page, '#late')).toBe('late');
  });
});

test.describe('disabled renders the content in flow (F4 (b))', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("a disabled host's root has no popover, computes display: contents and no position: fixed", async ({ page }) => {
    await mount(page, '<div><line-portal id="p" disabled><span id="c">Content</span></line-portal></div>');
    const root = await page.evaluate(() => {
      const element = document.getElementById('p')?.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
      const style = getComputedStyle(element);
      return { popover: element.hasAttribute('popover'), display: style.display, position: style.position };
    });
    expect(root.popover).toBe(false);
    expect(root.display).toBe('contents');
    expect(root.position).not.toBe('fixed');
    expect(await isOpen(page, '#p')).toBe(false);
  });

  for (const [label, withPortal, without] of [
    [
      'a flex row',
      '<div style="display: flex; gap: 10px; inline-size: 400px"><span>A</span><line-portal id="p" disabled><span>Content</span></line-portal><span id="b">B</span></div>',
      '<div style="display: flex; gap: 10px; inline-size: 400px"><span>A</span><span>Content</span><span id="b">B</span></div>',
    ],
    [
      'a paragraph',
      '<p style="inline-size: 400px">Read <line-portal id="p" disabled>the words written here</line-portal> in line.<span id="b">B</span></p>',
      '<p style="inline-size: 400px">Read the words written here in line.<span id="b">B</span></p>',
    ],
  ] as const) {
    test(`inside ${label}, a following neighbour sits where it sits without the Portal`, async ({ page }) => {
      await mount(page, without);
      const expected = await page.evaluate(() => {
        const { left, top } = (document.getElementById('b') as HTMLElement).getBoundingClientRect();
        return { left, top };
      });
      await mount(page, withPortal);
      const actual = await page.evaluate(() => {
        const { left, top } = (document.getElementById('b') as HTMLElement).getBoundingClientRect();
        return { left, top };
      });
      expect(actual).toEqual(expected);
    });
  }

  test('clearing disabled shows the box again (P11)', async ({ page }) => {
    await mount(page, '<line-portal id="p" disabled><span id="c">Content</span></line-portal>');
    expect(await isOpen(page, '#p')).toBe(false);
    await page.evaluate(async () => {
      const host = document.getElementById('p') as PortalElement;
      host.disabled = false;
      await host.updateComplete;
    });
    expect(await isOpen(page, '#p')).toBe(true);
  });
});

test.describe('with no content (C8)', () => {
  test('the root measures 0 × 0 and takes no hit at the logical start corner', async ({ page }) => {
    await open(page);
    await mount(page, '<line-portal id="p"></line-portal>');
    expect(await isOpen(page, '#p')).toBe(true);
    const box = await rootBox(page, '#p');
    expect([box.width, box.height]).toEqual([0, 0]);
    const hit = await page.evaluate(() => {
      const element = document.elementFromPoint(0, 0);
      const host = document.getElementById('p') as HTMLElement;
      return element === host || element === host.shadowRoot?.querySelector('[part="root"]');
    });
    expect(hit).toBe(false);
  });
});

const DIALOG = `
  <style>
    #hint::part(root):popover-open { inset-block-start: 20px; inset-inline-start: 20px; }
  </style>
  <dialog id="d">
    <p>Settings</p>
    <line-portal id="hint"><button type="button" id="inner">Inner</button></line-portal>
    <button type="button" id="close">Close</button>
  </dialog>
`;

test.describe('inside a modal dialog (P8; F7)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
    await mount(page, DIALOG);
    await page.evaluate(() => {
      (window as unknown as { clicks: number }).clicks = 0;
      document.getElementById('inner')?.addEventListener('click', () => {
        (window as unknown as { clicks: number }).clicks++;
      });
    });
  });

  test('the content stays focusable, and after bringToFront() it is hit and takes a real pointer click, again after a reopen', async ({
    page,
  }) => {
    await page.evaluate(() => (document.getElementById('d') as HTMLDialogElement).showModal());
    expect(
      await page.evaluate(() => {
        (document.getElementById('inner') as HTMLElement).focus();
        return document.activeElement?.id;
      }),
    ).toBe('inner');
    // Shown before showModal(), the box paints under the dialog's backdrop.
    expect(await hitAtCentre(page, '#inner')).not.toBe('inner');
    for (let round = 0; round < 2; round++) {
      if (round === 1) {
        await page.evaluate(() => {
          const dialog = document.getElementById('d') as HTMLDialogElement;
          dialog.close();
          dialog.showModal();
        });
        expect(await hitAtCentre(page, '#inner')).not.toBe('inner');
      }
      await page.evaluate(() => (document.getElementById('hint') as PortalElement).bringToFront());
      expect(await isOpen(page, '#hint')).toBe(true);
      expect(await hitAtCentre(page, '#inner')).toBe('inner');
      await page.locator('#inner').click();
      expect(await page.evaluate(() => (window as unknown as { clicks: number }).clicks)).toBe(round + 1);
    }
  });
});

test.describe('outside the open modal dialog (F7)', () => {
  test('after bringToFront() the box paints above the backdrop, and its content stays inert', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<style>
        #d::backdrop { background: rgb(255, 0, 0); }
        #out::part(root):popover-open {
          inset-block-start: 20px; inset-inline-start: 20px; inline-size: 120px; block-size: 60px;
          background: rgb(0, 128, 0);
        }
      </style>
      <line-portal id="out"><button type="button" id="inner">Inner</button></line-portal>
      <dialog id="d"><p>Settings</p></dialog>`,
    );
    await page.evaluate(() => {
      (document.getElementById('d') as HTMLDialogElement).showModal();
      (document.getElementById('out') as PortalElement).bringToFront();
    });
    expect(await isOpen(page, '#out')).toBe(true);
    const box = await rootBox(page, '#out');
    const png = await page.screenshot({
      clip: { x: box.x + box.width - 10, y: box.y + box.height - 10, width: 1, height: 1 },
    });
    const pixel = await page.evaluate(
      async (bytes) => {
        const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
        const canvas = new OffscreenCanvas(1, 1);
        const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        context.drawImage(bitmap, 0, 0);
        return [...context.getImageData(0, 0, 1, 1).data];
      },
      [...png],
    );
    expect(pixel).toEqual([0, 128, 0, 255]);
    // Hit testing skips inert content, so focus shows the content is inert.
    expect(
      await page.evaluate(() => {
        (document.getElementById('inner') as HTMLElement).focus();
        return document.activeElement?.id;
      }),
    ).not.toBe('inner');
  });
});

test.describe('bringToFront() guards (F7; D7)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('on a disabled host it leaves the root closed and the content in flow', async ({ page }) => {
    await mount(
      page,
      '<div style="display: flex"><line-portal id="p" disabled><span id="c">C</span></line-portal></div>',
    );
    await page.evaluate(() => (document.getElementById('p') as PortalElement).bringToFront());
    expect(await isOpen(page, '#p')).toBe(false);
    expect(await page.evaluate(() => (document.getElementById('c') as HTMLElement).checkVisibility())).toBe(true);
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.getElementById('p')?.shadowRoot?.querySelector('[part="root"]') as HTMLElement)
            .display,
      ),
    ).toBe('contents');
  });

  test('on a disconnected host it leaves the root closed', async ({ page }) => {
    await mount(page, '<line-portal id="p"><span>C</span></line-portal>');
    const state = await page.evaluate(() => {
      const host = document.getElementById('p') as PortalElement;
      const root = host.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
      host.remove();
      host.bringToFront();
      return root.matches(':popover-open');
    });
    expect(state).toBe(false);
  });

  test('on a host appended in the same task, before its first update, it throws nothing and the box opens', async ({
    page,
  }) => {
    await mount(page, '');
    const opened = await page.evaluate(async () => {
      const host = document.createElement('line-portal') as PortalElement;
      host.textContent = 'C';
      document.querySelector('main')?.append(host);
      host.bringToFront();
      await host.updateComplete;
      return host.shadowRoot?.querySelector('[part="root"]')?.matches(':popover-open');
    });
    expect(opened).toBe(true);
  });

  test('right after disabled is cleared in the same task it throws nothing and the box opens', async ({ page }) => {
    await mount(page, '<line-portal id="p" disabled>C</line-portal>');
    const opened = await page.evaluate(async () => {
      const host = document.getElementById('p') as PortalElement;
      host.disabled = false;
      host.bringToFront();
      await host.updateComplete;
      return host.shadowRoot?.querySelector('[part="root"]')?.matches(':popover-open');
    });
    expect(opened).toBe(true);
  });
});

test.describe('nested portals', () => {
  test('outer, then inner raises the inner content; outer alone covers it', async ({ page }) => {
    await open(page);
    await mount(
      page,
      `<style>
        #outer::part(root):popover-open {
          inset-block-start: 100px; inset-inline-start: 100px; inline-size: 240px; block-size: 120px;
          background: rgb(0, 0, 255);
        }
        #inner::part(root):popover-open { inset-block-start: 140px; inset-inline-start: 140px; }
      </style>
      <line-portal id="outer">Panel<line-portal id="inner"><span id="tip" style="display: inline-block; inline-size: 60px; block-size: 30px">Tip</span></line-portal></line-portal>`,
    );
    const raise = (ids: string[]) =>
      page.evaluate((each) => {
        for (const id of each) (document.getElementById(id) as PortalElement).bringToFront();
      }, ids);
    await raise(['outer']);
    expect(await hitAtCentre(page, '#tip')).toBe('outer');
    await raise(['outer', 'inner']);
    expect(await hitAtCentre(page, '#tip')).toBe('tip');
    await page.evaluate(async () => {
      const outer = document.getElementById('outer') as PortalElement;
      outer.disabled = true;
      await outer.updateComplete;
      outer.disabled = false;
      await outer.updateComplete;
    });
    expect(await hitAtCentre(page, '#tip')).toBe('outer');
    await raise(['inner']);
    expect(await hitAtCentre(page, '#tip')).toBe('tip');
  });
});

test.describe('top-layer box (P11, P12)', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('a later host paints above an earlier one', async ({ page }) => {
    await mount(
      page,
      `<style>
        line-portal::part(root):popover-open { inset-block-start: 200px; inset-inline-start: 200px; }
        line-portal span { display: inline-block; inline-size: 80px; block-size: 40px; }
      </style>
      <line-portal id="first"><span id="a">A</span></line-portal>`,
    );
    await page.evaluate(async () => {
      const second = document.createElement('line-portal') as PortalElement;
      second.innerHTML = '<span id="b">B</span>';
      document.querySelector('main')?.append(second);
      await second.updateComplete;
    });
    expect(await hitAtCentre(page, '#a')).toBe('b');
  });

  test('hidden on the host and a display: none ancestor render nothing', async ({ page }) => {
    await mount(
      page,
      `<line-portal id="h" hidden><span id="c1">One</span></line-portal>
      <div style="display: none"><line-portal id="n"><span id="c2">Two</span></line-portal></div>`,
    );
    const visible = await page.evaluate(() =>
      ['c1', 'c2'].map((id) => (document.getElementById(id) as HTMLElement).checkVisibility()),
    );
    expect(visible).toEqual([false, false]);
  });

  test('the host adds no offset in a flex row with gap', async ({ page }) => {
    const row = (inner: string) =>
      `<div style="display: flex; gap: 10px; inline-size: 300px"><span>A</span>${inner}<span id="b">B</span></div>`;
    await mount(page, row(''));
    const expected = await left(page, '#b');
    await mount(page, row('<line-portal id="p"><span>Content</span></line-portal>'));
    expect(await isOpen(page, '#p')).toBe(true);
    expect(await left(page, '#b')).toBe(expected);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`with no placement rule the box sits at the logical start corner (${dir})`, async ({ page }) => {
      await mount(
        page,
        `<div dir="${dir}"><line-portal id="p"><span style="display: inline-block; inline-size: 50px; block-size: 20px">C</span></line-portal></div>`,
      );
      const box = await rootBox(page, '#p');
      const viewport = await page.evaluate(() => document.documentElement.clientWidth);
      expect(box.y).toBeLessThanOrEqual(1);
      expect(box.y).toBeGreaterThanOrEqual(0);
      if (dir === 'ltr') expect(box.x).toBeLessThanOrEqual(1);
      else expect(Math.abs(box.x + box.width - viewport)).toBeLessThanOrEqual(1);
    });
  }

  test('the documented anchor rule puts the box under its trigger, at its inline start', async ({ page }) => {
    await mount(
      page,
      `<style>
        .trigger { anchor-name: --menu; margin-block-start: 150px; margin-inline-start: 220px; }
        line-portal.menu::part(root):popover-open {
          position-anchor: --menu;
          inset: auto;
          inset-block-start: anchor(end);
          inset-inline-start: anchor(start);
        }
      </style>
      <div class="card" style="overflow: hidden">
        <button type="button" class="trigger" id="t">Options</button>
        <line-portal class="menu" id="p"><ul style="margin: 0"><li><a href="#rename">Rename</a></li></ul></line-portal>
      </div>`,
    );
    const trigger = await page.evaluate(() => {
      const { left, bottom } = (document.getElementById('t') as HTMLElement).getBoundingClientRect();
      return { left, bottom };
    });
    const box = await rootBox(page, '#p');
    expect(Math.abs(box.y - trigger.bottom)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.x - trigger.left)).toBeLessThanOrEqual(1);
  });

  test('a page scroll leaves an unanchored box at its viewport point', async ({ page }) => {
    await mount(
      page,
      `<style>#p::part(root):popover-open { inset-block-start: 50px; inset-inline-start: 50px; }</style>
      <line-portal id="p"><span>C</span></line-portal><div style="block-size: 3000px"></div>`,
    );
    const before = await rootBox(page, '#p');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForFunction(() => window.scrollY === 500);
    const after = await rootBox(page, '#p');
    expect([after.x, after.y]).toEqual([before.x, before.y]);
    expect(before.y).toBe(50);
  });
});

test.describe('before the upgrade (P6; D8)', () => {
  test('the documented :not(:defined) rule hides the content until the module loads, then the box shows', async ({
    page,
  }) => {
    await page.goto(`${FIXTURE_URL}pre-upgrade.html`);
    expect(await page.evaluate(() => customElements.get('line-portal'))).toBeUndefined();
    expect(await page.evaluate(() => (document.getElementById('inner') as HTMLElement).checkVisibility())).toBe(false);
    await page.evaluate(async () => {
      await (window as unknown as { lineLoad: () => Promise<unknown> }).lineLoad();
      await (document.getElementById('p') as PortalElement).updateComplete;
    });
    expect(await isOpen(page, '#p')).toBe(true);
    expect(await page.evaluate(() => (document.getElementById('inner') as HTMLElement).checkVisibility())).toBe(true);
    expect(await hitAtCentre(page, '#inner')).toBe('inner');
  });
});
