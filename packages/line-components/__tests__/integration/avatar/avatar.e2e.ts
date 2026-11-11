/**
 * `<line-avatar>` browser tier (spec `0009-avatar.md` Tests, Browser row; Phase 1 spec §7.8, §10 SD99).
 *
 * Runs in chromium, firefox and webkit on the fixture pages that the third `webServer` of `playwright.config.ts`
 * serves on port 4321. `index.html` loads the built `@websublime/line-components/avatar` and `./badge` with the radii,
 * sizing and typography tokens and `line-themes`; `no-theme.html` leaves `line-themes` out. Each test mounts its
 * markup into `<main>`. Pictures come from `page.route`: `ok.png` is a valid PNG, `slow.png` the same after a delay
 * the test releases, any other `img/` path a 404. The role and the name sit on the shadow `root`, so Playwright's
 * `ariaSnapshot()` proves them in all three engines (spec probe P2; D14), and a Chromium CDP session proves the name
 * of an enclosing link. No `INTERNALS` read-back runs: Avatar sets no internals role.
 *
 * @module __tests__/integration/avatar/avatar.e2e
 */

import { expect, type Page, test } from 'playwright/test';

const FIXTURE_URL = 'http://127.0.0.1:4321/avatar/';

/** A 4×4 opaque red PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGP4z8AARwzEcQCukw/x0F8jngAAAABJRU5ErkJggg==',
  'base64',
);

/** `--line-size-7`, its 40 % for the initials, `--line-font-weight-5`. */
const SIZE = 32;
const FONT_SIZE = 12.8;
const FONT_WEIGHT = '500';

/** Serves the pictures; `slow.png` waits for the returned release function. */
async function servePictures(page: Page): Promise<() => void> {
  const gate = Promise.withResolvers<void>();
  await page.route('**/img/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/ok.png') || path.endsWith('/ok2.png')) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    }
    if (path.endsWith('/slow.png')) {
      await gate.promise;
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    }
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' });
  });
  return gate.resolve;
}

async function open(page: Page, path = ''): Promise<void> {
  await page.goto(`${FIXTURE_URL}${path}`);
  await page.evaluate(() => customElements.whenDefined('line-avatar'));
}

/** Replaces the content of `<main>` and waits for every avatar and badge to render. */
async function mount(page: Page, markup: string): Promise<void> {
  await page.evaluate(async (html) => {
    const main = document.querySelector('main') as HTMLElement;
    main.innerHTML = html;
    const settle = () =>
      Promise.all(
        [...main.querySelectorAll('line-avatar, line-badge')].map(
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

/** The flags, the zone `root` shows and the visibility of the image and the fallback, for the avatar `selector`. */
function state(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel) as HTMLElement;
    const shadow = host.shadowRoot as ShadowRoot;
    const image = shadow.querySelector('[part="image"]') as HTMLElement | null;
    const fallback = shadow.querySelector('[part="fallback"]') as HTMLElement;
    return {
      loading: host.hasAttribute('data-loading') && host.matches(':state(loading)'),
      error: host.hasAttribute('data-error') && host.matches(':state(error)'),
      image: image ? getComputedStyle(image).visibility : null,
      fallback: getComputedStyle(fallback).visibility,
    };
  }, selector);
}

/** Waits until the avatar `selector` is not loading. */
async function settled(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).not.toHaveAttribute('data-loading');
}

/** WebKit on macOS moves Tab focus to text fields only; Option+Tab reaches every focusable element. */
function tab(browserName: string): string {
  return browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
}

function expectNear(actual: number, expected: number, label: string): void {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThan(0.5);
}

/** Palette steps the avatar reads, each its own colour, so a wrong step shows (0011-separator.md AM-001). */
const GRAY_STEPS = { 1: 'rgb(10, 1, 99)', 3: 'rgb(10, 3, 99)', 12: 'rgb(10, 12, 99)' } as const;
const PALETTE_STYLE = `<style>html { ${['sand', 'slate']
  .flatMap((hue) => Object.entries(GRAY_STEPS).map(([step, colour]) => `--line-${hue}-${step}: ${colour};`))
  .join(' ')} }</style>`;

test.describe('with line-tokens and line-themes', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('Tab skips the host (SD99)', async ({ page, browserName }) => {
    await mount(
      page,
      `<button id="before">Before</button><line-avatar name="Ana Silva"></line-avatar><button id="after">After</button>`,
    );
    await page.locator('#before').focus();
    await page.keyboard.press(tab(browserName));
    await expect(page.locator('#after')).toBeFocused();
  });

  test('a good src loads: no flag, the image shows and the fallback hides (F5; D5)', async ({ page }) => {
    await servePictures(page);
    await mount(page, '<line-avatar id="a" src="img/ok.png" name="Ana Silva"></line-avatar>');
    await settled(page, '#a');
    expect(await state(page, '#a')).toEqual({ loading: false, error: false, image: 'visible', fallback: 'hidden' });
  });

  test('a slow src is loading until it loads, with the fallback showing (F5; D5)', async ({ page }) => {
    const release = await servePictures(page);
    await mount(page, '<line-avatar id="a" src="img/slow.png" name="Ana Silva"></line-avatar>');
    expect(await state(page, '#a')).toEqual({ loading: true, error: false, image: 'hidden', fallback: 'visible' });
    release();
    await settled(page, '#a');
    expect(await state(page, '#a')).toEqual({ loading: false, error: false, image: 'visible', fallback: 'hidden' });
  });

  test('a 404 sets error and keeps the initials; a change to a good src and a removed src follow (D6)', async ({
    page,
  }) => {
    await servePictures(page);
    await mount(page, '<line-avatar id="a" src="img/missing.png" name="Rui Costa"></line-avatar>');
    await expect(page.locator('#a')).toHaveAttribute('data-error', '');
    expect(await state(page, '#a')).toEqual({ loading: false, error: true, image: 'hidden', fallback: 'visible' });
    await page.locator('#a').evaluate((el) => el.setAttribute('src', 'img/ok2.png'));
    await expect(page.locator('#a')).not.toHaveAttribute('data-error');
    await settled(page, '#a');
    expect(await state(page, '#a')).toEqual({ loading: false, error: false, image: 'visible', fallback: 'hidden' });
    await page.locator('#a').evaluate((el) => el.setAttribute('src', 'img/gone.png'));
    await expect(page.locator('#a')).toHaveAttribute('data-error', '');
    await page.locator('#a').evaluate((el) => el.removeAttribute('src'));
    await expect(page.locator('#a')).not.toHaveAttribute('data-error');
    expect(await state(page, '#a')).toEqual({ loading: false, error: false, image: null, fallback: 'visible' });
  });

  test('the role and name sit on root and Playwright sees them in every engine (F2, F3; D14)', async ({ page }) => {
    await servePictures(page);
    await mount(
      page,
      `<div id="loaded"><line-avatar id="l" src="img/ok.png" name="Ana Silva"></line-avatar></div>
       <div id="failed"><line-avatar id="f" src="img/missing.png" name="Rui Costa"></line-avatar></div>
       <div id="override"><line-avatar name="Ana Silva" aria-label="Ana Silva, team lead"></line-avatar></div>
       <div id="decorative"><line-avatar src="img/ok.png"></line-avatar> Mia Santos</div>
       <div id="linked"><a href="#me"><line-avatar src="img/ok.png" name="Ana Silva">
         <line-badge slot="status" variant="success" aria-label="Online"></line-badge></line-avatar></a></div>`,
    );
    await settled(page, '#l');
    await expect(page.locator('#f')).toHaveAttribute('data-error', '');
    await expect(page.locator('#loaded')).toMatchAriaSnapshot('- img "Ana Silva"');
    await expect(page.locator('#failed')).toMatchAriaSnapshot('- img "Rui Costa"');
    await expect(page.locator('#override')).toMatchAriaSnapshot('- img "Ana Silva, team lead"');
    expect(await page.locator('#decorative').ariaSnapshot()).toBe('- text: Mia Santos');
    // The badge's own `img` role lives in its internals, which Playwright does not read; its name reaches the link.
    await expect(page.locator('#linked')).toMatchAriaSnapshot(`
      - link "Ana Silva Online":
        - img "Ana Silva"
    `);
  });

  test('Chromium names a link around an avatar and its status "Ana Silva Online" (probe P1)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'CDP runs in Chromium only (D14)');
    await servePictures(page);
    await mount(
      page,
      `<a id="named" href="#me"><line-avatar src="img/ok.png" name="Ana Silva">
         <line-badge slot="status" variant="success" aria-label="Online"></line-badge></line-avatar></a>
       <a id="initials" href="#rui"><line-avatar name="Rui Costa"></line-avatar></a>
       <a id="decorative" href="#mia"><line-avatar src="img/ok.png"></line-avatar> Mia Santos</a>`,
    );
    const cdp = await page.context().newCDPSession(page);
    const name = async (selector: string) => {
      const { root } = (await cdp.send('DOM.getDocument', { depth: -1, pierce: true })) as { root: { nodeId: number } };
      const { nodeId } = (await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector })) as { nodeId: number };
      const { nodes } = (await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })) as {
        nodes: { role?: { value: string }; name?: { value: string } }[];
      };
      return { role: nodes[0]?.role?.value, name: nodes[0]?.name?.value?.trim() };
    };
    expect(await name('#named')).toEqual({ role: 'link', name: 'Ana Silva Online' });
    expect(await name('#initials')).toEqual({ role: 'link', name: 'Rui Costa' });
    expect(await name('#decorative')).toEqual({ role: 'link', name: 'Mia Santos' });
  });

  test('the frame, fallback and ring take their token defaults (D8)', async ({ page }) => {
    await mount(page, `${PALETTE_STYLE}<line-avatar id="a" name="Ana Silva"></line-avatar>`);
    const values = await page.locator('#a').evaluate((host) => {
      const shadow = host.shadowRoot as ShadowRoot;
      const root = getComputedStyle(shadow.querySelector('[part="root"]') as HTMLElement);
      const fallback = getComputedStyle(shadow.querySelector('[part="fallback"]') as HTMLElement);
      const box = host.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        radius: root.borderTopLeftRadius,
        bg: root.backgroundColor,
        shadow: root.boxShadow,
        color: fallback.color,
        fontSize: Number.parseFloat(fallback.fontSize),
        fontWeight: fallback.fontWeight,
        text: shadow.querySelector('[part="fallback"]')?.textContent?.trim(),
      };
    });
    expectNear(values.width, SIZE, 'width');
    expectNear(values.height, SIZE, 'height');
    expectNear(values.fontSize, FONT_SIZE, 'font size');
    expect(values).toMatchObject({
      radius: '100000px',
      bg: GRAY_STEPS[3],
      color: GRAY_STEPS[12],
      fontWeight: FONT_WEIGHT,
      text: 'AS',
    });
    expect(values.shadow).toBe(`${GRAY_STEPS[1]} 0px 0px 0px 0px`);
  });

  test('a container sets size, ring and status visibility by inheritance, through a link (contract G1–G4)', async ({
    page,
  }) => {
    await mount(
      page,
      `<div style="--line-avatar-size: 48px; --line-avatar-ring-width: 2px; --line-avatar-status-visibility: hidden">
         <a href="#a"><line-avatar id="a" name="Ana Silva">
           <line-badge id="s" slot="status" variant="success" aria-label="Online"></line-badge></line-avatar></a>
       </div>`,
    );
    const values = await page.locator('#a').evaluate((host) => {
      const root = (host.shadowRoot as ShadowRoot).querySelector('[part="root"]') as HTMLElement;
      const status = host.querySelector('#s') as HTMLElement;
      return {
        width: host.getBoundingClientRect().width,
        shadow: getComputedStyle(root).boxShadow,
        status: getComputedStyle(status).visibility,
        display: getComputedStyle(host).display,
      };
    });
    expectNear(values.width, 48, 'inherited size');
    expect(values.shadow).toMatch(/ 0px 0px 0px 2px$/);
    expect(values.status).toBe('hidden');
    expect(values.display).toBe('inline-block');
    await expect(page.locator('a')).toMatchAriaSnapshot('- link "Ana Silva"');
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`the status marker sits at the inline-end, block-end corner under dir="${dir}" (F6)`, async ({ page }) => {
      await mount(
        page,
        `<div dir="${dir}"><line-avatar id="a" name="Ana Silva">
           <line-badge id="s" slot="status" variant="success" aria-label="Online"></line-badge></line-avatar></div>`,
      );
      const boxes = await page.locator('#a').evaluate((host) => {
        const status = (host.querySelector('#s') as HTMLElement).getBoundingClientRect();
        const box = host.getBoundingClientRect();
        return { host: { left: box.left, right: box.right, bottom: box.bottom }, status };
      });
      expectNear(boxes.status.bottom, boxes.host.bottom, 'bottom');
      if (dir === 'ltr') expectNear(boxes.status.right, boxes.host.right, 'right');
      else expectNear(boxes.status.left, boxes.host.left, 'left');
    });
  }
});

test.describe('without line-themes', () => {
  test('the frame stays transparent, the initials take the inherited colour, and the ring falls back to Canvas', async ({
    page,
  }) => {
    await open(page, 'no-theme.html');
    await mount(page, '<div style="color: rgb(1, 2, 3)"><line-avatar id="a" name="Ana Silva"></line-avatar></div>');
    const values = await page.locator('#a').evaluate((host) => {
      const shadow = host.shadowRoot as ShadowRoot;
      const root = getComputedStyle(shadow.querySelector('[part="root"]') as HTMLElement);
      const fallback = getComputedStyle(shadow.querySelector('[part="fallback"]') as HTMLElement);
      const canvas = document.createElement('span');
      canvas.style.color = 'Canvas';
      document.body.append(canvas);
      const expected = getComputedStyle(canvas).color;
      canvas.remove();
      return { bg: root.backgroundColor, color: fallback.color, shadow: root.boxShadow, canvas: expected };
    });
    expect(values.bg).toBe('rgba(0, 0, 0, 0)');
    expect(values.color).toBe('rgb(1, 2, 3)');
    expect(values.shadow).toBe(`${values.canvas} 0px 0px 0px 0px`);
  });
});
