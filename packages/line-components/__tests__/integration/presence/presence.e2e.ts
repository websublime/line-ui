/**
 * `<line-presence>` browser tier (spec `0017-presence.md` Tests, Browser row; Phase 1 spec §7.8, §10 SD99, §12
 * AM-058).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `./presence` subpath and holds the page keyframes and rules each
 * test selects by class; each test mounts its markup into `<main>`. `pre-upgrade.html` loads `./presence` only when the
 * test asks. A capturing `document` listener, installed before the page loads, logs every completion event and the
 * machine's own `exitcomplete` with its time and whether `root` was hidden when it fired. The hidden content is read
 * with Playwright's `ariaSnapshot()` in every engine and through a CDP session in chromium only (D20). Timings carry
 * wide margins: exits that wait for a 300 ms animation must take more than 250 ms, and exits that end in one frame
 * less than 150 ms.
 *
 * @module __tests__/integration/presence/presence.e2e
 */

import { type CDPSession, expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/presence/';

/** An exit or enter that waits for a 300 ms animation takes longer than this (P2). */
const ANIMATED_MS = 250;
/** An exit or enter without an animation ends within this (P4, 8–18 ms). */
const ONE_FRAME_MS = 150;

interface LogEntry {
  type: string;
  id: string;
  t: number;
  rootHidden: boolean | null;
}

declare global {
  interface Window {
    presenceLog: LogEntry[];
    /** A host the removal test keeps while it is out of the document. */
    reinsert?: HTMLElement;
  }
}

type Host = HTMLElement & { present: boolean; updateComplete: Promise<unknown> };

async function open(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.presenceLog = [];
    for (const type of ['line-exit-complete', 'line-enter-complete', 'exitcomplete']) {
      document.addEventListener(
        type,
        (event) => {
          const host = event.target as HTMLElement;
          window.presenceLog.push({
            type,
            id: host.id,
            t: performance.now(),
            rootHidden: host.shadowRoot?.querySelector<HTMLElement>('[part="root"]')?.hidden ?? null,
          });
        },
        { capture: true },
      );
    }
  });
  await page.goto(FIXTURE_URL);
  await page.evaluate(() => customElements.whenDefined('line-presence'));
}

/** Replaces the content of `<main>`, waits for every presence to update and for every enter animation to end. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const hosts = [...main.querySelectorAll('line-presence')] as Host[];
    await Promise.all(hosts.map((el) => el.updateComplete));
    const frame = Promise.withResolvers<number>();
    requestAnimationFrame(frame.resolve);
    await frame.promise;
    await Promise.all(hosts.map((el) => el.updateComplete));
    const roots = hosts.map((el) => el.shadowRoot?.querySelector('[part="root"]') as HTMLElement);
    await Promise.all(
      roots.flatMap((root) => root.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
    );
    window.presenceLog.length = 0;
  }, markup);
}

interface Change {
  /** The state of `root` 150 ms after the change, when `sampleAt` is set. */
  mid: { hidden: boolean; names: string[] } | null;
  /** Milliseconds from the change to its completion event, or `null` when none fired within 3 s. */
  elapsed: number | null;
  /** Whether `root` is hidden once the change completed or the wait ran out. */
  hidden: boolean;
  /** The completion events of this host since the change, in order. */
  events: string[];
}

/**
 * Sets `present` on the host with `id`, optionally samples `root` 150 ms later, and waits up to 3 s for the change's
 * completion event.
 */
function change(page: Page, id: string, present: boolean, sample = false): Promise<Change> {
  return page.evaluate(
    async ({ id, present, sample }) => {
      const host = document.getElementById(id) as Host;
      const root = host.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
      const type = present ? 'line-enter-complete' : 'line-exit-complete';
      const sleep = (ms: number) => {
        const { promise, resolve } = Promise.withResolvers<void>();
        setTimeout(resolve, ms);
        return promise;
      };
      window.presenceLog.length = 0;
      const start = performance.now();
      host.present = present;
      let mid: { hidden: boolean; names: string[] } | null = null;
      if (sample) {
        await sleep(150);
        mid = {
          hidden: root.hidden,
          names: root.getAnimations().map((animation) => (animation as CSSAnimation).animationName),
        };
      }
      const done = () => window.presenceLog.find((entry) => entry.id === id && entry.type === type);
      while (!done() && performance.now() - start < 3000) await sleep(5);
      const entry = done();
      return {
        mid,
        elapsed: entry ? entry.t - start : null,
        hidden: root.hidden,
        events: window.presenceLog.filter((each) => each.id === id).map((each) => each.type),
      };
    },
    { id, present, sample },
  );
}

/** Waits `ms` milliseconds in the page. */
function pause(page: Page, ms: number): Promise<void> {
  return page.evaluate((ms) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, ms);
    return promise;
  }, ms);
}

function rootHidden(page: Page, id: string): Promise<boolean> {
  return page.evaluate(
    (id) =>
      (document.getElementById(id) as Host).shadowRoot?.querySelector<HTMLElement>('[part="root"]')?.hidden === true,
    id,
  );
}

function runningAnimations(page: Page, id: string): Promise<string[]> {
  return page.evaluate((id) => {
    const root = document.getElementById(id)?.shadowRoot?.querySelector('[part="root"]') as HTMLElement;
    return root
      .getAnimations()
      .filter((animation) => animation.playState === 'running')
      .map((animation) => (animation as CSSAnimation).animationName);
  }, id);
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

test.describe('the exit waits for the page animation of ::part(root) (P2)', () => {
  for (const form of ['attr', 'state']) {
    test(`keyed on ${form === 'attr' ? ':not([data-open])' : ':not(:state(open))'}`, async ({ page }) => {
      await open(page);
      await mount(page, `<line-presence id="p" class="${form}" present><p>Text</p></line-presence>`);
      const exit = await change(page, 'p', false, true);
      expect(exit.mid).toEqual({ hidden: false, names: ['t-out'] });
      expect(exit.elapsed).toBeGreaterThan(ANIMATED_MS);
      expect(exit.hidden).toBe(true);
      expect(exit.events).toEqual(['line-exit-complete']);
    });
  }

  test('line-enter-complete fires after the enter animation', async ({ page }) => {
    await open(page);
    await mount(page, '<line-presence id="p" class="attr"><p>Text</p></line-presence>');
    const enter = await change(page, 'p', true, true);
    expect(enter.mid).toEqual({ hidden: false, names: ['t-in'] });
    expect(enter.elapsed).toBeGreaterThan(ANIMATED_MS);
    expect(enter.events).toEqual(['line-enter-complete']);
  });

  test('descendant animations, one with the exit keyframe name, do not end the exit early', async ({ page }) => {
    await open(page);
    await mount(
      page,
      '<line-presence id="p" class="attr" present><p><span class="spin">Spin</span> <span class="short">Short</span></p></line-presence>',
    );
    await page.evaluate(() => {
      for (const el of document.querySelectorAll<HTMLElement>('.short')) {
        el.style.animation = 'none';
        el.getBoundingClientRect();
        el.style.animation = '';
      }
    });
    const exit = await change(page, 'p', false);
    expect(exit.elapsed).toBeGreaterThan(ANIMATED_MS);
    expect(exit.hidden).toBe(true);
  });
});

test.describe('exits that end in one frame (P4)', () => {
  for (const [form, label] of [
    ['none', 'animation: none'],
    ['zero', 'a 0s duration'],
    ['transition', 'a CSS transition'],
  ]) {
    test(label, async ({ page }) => {
      await open(page);
      await mount(page, `<line-presence id="p" class="${form}" present><p>Text</p></line-presence>`);
      const exit = await change(page, 'p', false);
      expect(exit.elapsed).not.toBeNull();
      expect(exit.elapsed).toBeLessThan(ONE_FRAME_MS);
      expect(exit.hidden).toBe(true);
    });
  }

  test('the same keyframes played in reverse skip the exit after a reopen, the documented anti-pattern', async ({
    page,
  }) => {
    await open(page);
    await mount(
      page,
      `<line-presence id="p" class="reverse" present><p>Reverse</p></line-presence>
      <line-presence id="q" class="attr" present><p>Distinct</p></line-presence>`,
    );
    for (const id of ['p', 'q']) {
      expect((await change(page, id, false)).hidden).toBe(true);
      expect((await change(page, id, true)).elapsed).not.toBeNull();
    }
    await pause(page, 50);
    const reversed = await change(page, 'p', false);
    expect(reversed.elapsed).not.toBeNull();
    expect(reversed.elapsed).toBeLessThan(ONE_FRAME_MS);
    const distinct = await change(page, 'q', false);
    expect(distinct.elapsed).toBeGreaterThan(ANIMATED_MS);
  });

  test('under reduced motion the gated rules show and hide at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await mount(page, '<line-presence id="p" class="gated" present><p>Text</p></line-presence>');
    const exit = await change(page, 'p', false);
    expect(exit.elapsed).not.toBeNull();
    expect(exit.elapsed).toBeLessThan(ONE_FRAME_MS);
    const enter = await change(page, 'p', true);
    expect(enter.elapsed).not.toBeNull();
    expect(enter.elapsed).toBeLessThan(ONE_FRAME_MS);
  });
});

test.describe('interrupted changes (P4; F7 (a))', () => {
  test('a reopen mid-exit keeps the content and fires no line-exit-complete', async ({ page }) => {
    await open(page);
    await mount(page, '<line-presence id="p" class="attr" present><p>Text</p></line-presence>');
    await page.evaluate(() => {
      (document.getElementById('p') as Host).present = false;
    });
    await pause(page, 100);
    const enter = await change(page, 'p', true);
    await pause(page, 400);
    expect(await rootHidden(page, 'p')).toBe(false);
    const events = await page.evaluate(() => window.presenceLog.map((entry) => entry.type));
    expect(events).not.toContain('line-exit-complete');
    expect(enter.events.filter((type) => type === 'line-enter-complete')).toHaveLength(1);
  });

  test('a close during an enter ends hidden with one line-exit-complete in every engine', async ({ page }) => {
    await open(page);
    await mount(page, '<line-presence id="p" class="attr"><p>Text</p></line-presence>');
    await page.evaluate(() => {
      (document.getElementById('p') as Host).present = true;
    });
    await pause(page, 100);
    const exit = await change(page, 'p', false);
    await pause(page, 500);
    expect(exit.elapsed).not.toBeNull();
    expect(await rootHidden(page, 'p')).toBe(true);
    const exits = await page.evaluate(() => window.presenceLog.filter((entry) => entry.type === 'line-exit-complete'));
    expect(exits).toHaveLength(1);
  });
});

test.describe('skip-animation-on-mount (F4 (b); D7)', () => {
  test('no running animation at the first render, and the first exit plays', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      (document.querySelector('main') as HTMLElement).innerHTML =
        '<line-presence id="p" class="attr" present skip-animation-on-mount><p>Text</p></line-presence>';
    });
    await page.evaluate(() => (document.getElementById('p') as Host).updateComplete);
    expect(await runningAnimations(page, 'p')).toEqual([]);
    const exit = await change(page, 'p', false, true);
    expect(exit.mid?.names).toEqual(['t-out']);
    expect(exit.elapsed).toBeGreaterThan(ANIMATED_MS);
  });

  test('a reinserted open host with the attribute runs no animation, and one without it replays its enter', async ({
    page,
  }) => {
    await open(page);
    await mount(
      page,
      `<line-presence id="skip" class="attr" present skip-animation-on-mount><p>Skip</p></line-presence>
      <line-presence id="plain" class="attr" present><p>Plain</p></line-presence>`,
    );
    await page.evaluate(async () => {
      const main = document.querySelector('main') as HTMLElement;
      const hosts = [...main.querySelectorAll('line-presence')] as Host[];
      for (const host of hosts) host.remove();
      main.append(...hosts);
      await Promise.all(hosts.map((host) => host.updateComplete));
    });
    expect(await runningAnimations(page, 'skip')).toEqual([]);
    expect(await runningAnimations(page, 'plain')).toEqual(['t-in']);
  });
});

test.describe('hidden content (P3; F2 (a); D20)', () => {
  const MARKUP = `<button id="before" type="button">Before</button>
    <line-presence id="p" class="attr force" present><button id="inner" type="button">Inner</button><p>Text</p></line-presence>
    <button id="after" type="button">After</button>`;

  test('leaves the snapshot, the Tab order and the screen, against a page ::part(root) display rule', async ({
    page,
    browserName,
  }) => {
    await open(page);
    await mount(page, MARKUP);
    await expect(page.locator('main')).toMatchAriaSnapshot(`
      - button "Before"
      - button "Inner"
      - paragraph: Text
      - button "After"
    `);
    const exit = await change(page, 'p', false);
    expect(exit.hidden).toBe(true);
    await expect(page.locator('main')).toMatchAriaSnapshot(`
      - button "Before"
      - button "After"
    `);
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.getElementById('p')?.shadowRoot?.querySelector('[part="root"]') as HTMLElement)
            .display,
      ),
    ).toBe('none');
    await expect(page.locator('#inner')).toBeHidden();
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
  });

  test('focus inside the content stays during the exit and leaves for body when it ends', async ({ page }) => {
    await open(page);
    await mount(page, MARKUP);
    await page.locator('#inner').focus();
    const exit = await change(page, 'p', false, true);
    expect(exit.mid?.hidden).toBe(false);
    expect(exit.elapsed).toBeGreaterThan(ANIMATED_MS);
    await expect.poll(() => page.evaluate(() => document.activeElement?.localName)).toBe('body');
  });

  test('the host has no box after the exit, and root animates inside the display: contents host (D3)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, MARKUP);
    const exit = await change(page, 'p', false, true);
    expect(exit.mid?.names).toEqual(['t-out']);
    const box = await page.evaluate(() => {
      const host = document.getElementById('p') as HTMLElement;
      const { width, height } = host.getBoundingClientRect();
      return { display: getComputedStyle(host).display, width, height };
    });
    expect(box).toEqual({ display: 'contents', width: 0, height: 0 });
  });
});

/** A Chromium accessibility-tree node, as `Accessibility.getFullAXTree` returns it. */
interface AXNode {
  nodeId: string;
  ignored: boolean;
  role?: { value: string };
  name?: { value: string };
  childIds?: string[];
  backendDOMNodeId?: number;
}

/** Every node below the element matched by `selector`, walked from its full-tree node. */
async function below(cdp: CDPSession, selector: string): Promise<AXNode[]> {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { node: dom } = await cdp.send('DOM.describeNode', { nodeId });
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: AXNode[] };
  const byId = new Map(nodes.map((each) => [each.nodeId, each]));
  const start = nodes.find((each) => each.backendDOMNodeId === dom.backendNodeId);
  const found: AXNode[] = [];
  const queue = [...(start?.childIds ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const child = byId.get(id);
    if (!child) continue;
    found.push(child);
    queue.push(...(child.childIds ?? []));
  }
  return found;
}

test.describe('Chromium accessibility tree (CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP sessions are Chromium-only (Phase 1 spec AM-058)');

  test('the content leaves the tree after the exit (P3; D20)', async ({ page }) => {
    await open(page);
    await mount(
      page,
      '<div id="wrap"><line-presence id="p" class="attr" present><button>Inner</button><p>Text</p></line-presence></div>',
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const shown = (await below(cdp, '#wrap')).filter((node) => !node.ignored);
    expect(shown.map((node) => node.role?.value)).toContain('button');
    await change(page, 'p', false);
    const hidden = (await below(cdp, '#wrap')).filter((node) => !node.ignored);
    expect(hidden.filter((node) => ['button', 'paragraph', 'StaticText'].includes(node.role?.value ?? ''))).toEqual([]);
  });
});

test.describe('events (P5; D8; F1 (b))', () => {
  test('a host removed mid-exit fires no line-exit-complete, and appended again hides its content (D7)', async ({
    page,
  }) => {
    await open(page);
    await mount(page, '<line-presence id="p" class="attr" present><p>Text</p></line-presence>');
    await page.evaluate(() => {
      (document.getElementById('p') as Host).present = false;
    });
    await pause(page, 100);
    await page.evaluate(() => {
      const host = document.getElementById('p') as Host;
      window.reinsert = host;
      host.remove();
    });
    await pause(page, 500);
    expect(await page.evaluate(() => window.presenceLog.map((entry) => entry.type))).toEqual([]);
    await page.evaluate(async () => {
      const host = window.reinsert as Host;
      (document.querySelector('main') as HTMLElement).append(host);
      await host.updateComplete;
    });
    await expect.poll(() => rootHidden(page, 'p')).toBe(true);
    await expect(page.locator('#p p')).toBeHidden();
  });

  test('no exitcomplete reaches a host listener or a capturing document listener', async ({ page }) => {
    await open(page);
    await mount(page, '<line-presence id="p" class="attr" present><p>Text</p></line-presence>');
    const seen = await page.evaluate(async () => {
      const host = document.getElementById('p') as Host;
      let count = 0;
      host.addEventListener('exitcomplete', () => count++);
      const done = Promise.withResolvers<void>();
      host.addEventListener('line-exit-complete', () => done.resolve(), { once: true });
      host.present = false;
      await done.promise;
      const later = Promise.withResolvers<void>();
      setTimeout(later.resolve, 100);
      await later.promise;
      return { host: count, document: window.presenceLog.filter((entry) => entry.type === 'exitcomplete').length };
    });
    expect(seen).toEqual({ host: 0, document: 0 });
  });

  test('a line-exit-complete listener finds root hidden and a line-enter-complete listener finds it shown', async ({
    page,
  }) => {
    await open(page);
    await mount(page, '<line-presence id="p" class="attr" present><p>Text</p></line-presence>');
    await change(page, 'p', false);
    const exits = await page.evaluate(() => window.presenceLog.filter((entry) => entry.type !== 'exitcomplete'));
    expect(exits.map(({ type, rootHidden }) => ({ type, rootHidden }))).toEqual([
      { type: 'line-exit-complete', rootHidden: true },
    ]);
    await change(page, 'p', true);
    const enters = await page.evaluate(() => window.presenceLog.filter((entry) => entry.type !== 'exitcomplete'));
    expect(enters.map(({ type, rootHidden }) => ({ type, rootHidden }))).toEqual([
      { type: 'line-enter-complete', rootHidden: false },
    ]);
  });
});

test.describe('before the module runs (P6; D10)', () => {
  test('the documented rule hides closed content and leaves open content shown', async ({ page }) => {
    await page.goto(`${FIXTURE_URL}pre-upgrade.html`);
    await expect(page.locator('#closed-text')).toBeHidden();
    await expect(page.locator('#open-text')).toBeVisible();
    await page.evaluate(async () => {
      await (window as Window & { lineLoad: () => Promise<unknown> }).lineLoad();
      await customElements.whenDefined('line-presence');
      await Promise.all([...document.querySelectorAll('line-presence')].map((el) => (el as Host).updateComplete));
    });
    await expect(page.locator('#closed-text')).toBeHidden();
    await expect(page.locator('#open-text')).toBeVisible();
  });
});
