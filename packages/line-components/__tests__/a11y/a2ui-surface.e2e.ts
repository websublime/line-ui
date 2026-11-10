/**
 * `<line-a2ui-surface>` axe tier (Phase 1 spec §6.G.4 Acceptance, §7.4, §9.2; §6.P.7).
 *
 * Opens every story of `apps/storybook/stories/agent-ui/a2ui-surface.stories.ts` on `storybook-static`
 * (port 4320), waits until the surface has settled and every rendered `line-*` element has upgraded and updated,
 * and expects zero violations of the §7.4 ruleset in chromium, firefox and webkit. The stories render C1–C4
 * (Button, Icon, Separator, Stack) through the basic and `line` catalogs, and C5 (IconButton) through the `line`
 * catalog; each agent-exposed C5–C20 row adds its component to the stories' render fixture and to this file
 * (§6.C.6). The List stories also prove axe's list rules: `aria-required-children` on the `role="list"` host and
 * `aria-required-parent` on each item pass. The Line catalog story also shows the IconButton named by its
 * `accessibility.label`, C6 (ButtonGroup) as a named toolbar with `loop` that roves over its IconButtons, and C7
 * (Alert) with its five zones filled, no live role, and a dismiss IconButton that hides it.
 *
 * @module __tests__/a11y/a2ui-surface.e2e
 */

import { expect, type Page, test } from 'playwright/test';
import { axe, expectNoAxeViolations } from './axe';

const STORYBOOK_ORIGIN = 'http://127.0.0.1:4320';

/** Every surface story by Storybook id, with the number of `line-*` elements it renders once settled. */
const SURFACE_STORIES = {
  'agent-ui-a2ui-surface--basic': 7,
  'agent-ui-a2ui-surface--line-catalog': 21,
  'agent-ui-a2ui-surface--list': 7,
  'agent-ui-a2ui-surface--mixed-list': 3,
  'agent-ui-a2ui-surface--placeholders': 1,
  'agent-ui-a2ui-surface--right-to-left': 2,
} as const satisfies Record<string, number>;

type SurfaceStoryId = keyof typeof SURFACE_STORIES;

/** Opens a surface story and waits until the surface settles and every rendered component has updated. */
async function openSurfaceStory(page: Page, id: SurfaceStoryId): Promise<void> {
  await page.goto(`${STORYBOOK_ORIGIN}/iframe.html?id=${id}&viewMode=story`);
  await expect(page.locator('body')).toHaveClass(/\bsb-show-main\b/);
  await expect(page.locator('#storybook-root line-a2ui-surface')).toBeAttached();
  await page.evaluate(async () => {
    const surface = document.querySelector('line-a2ui-surface') as HTMLElement & { settled(): Promise<void> };
    await surface.settled();
    const rendered = [...surface.querySelectorAll('*')].filter((element) => element.localName.startsWith('line-'));
    await Promise.all(
      rendered.map(async (element) => {
        await customElements.whenDefined(element.localName);
        await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
      }),
    );
  });
  const surface = page.locator('#storybook-root line-a2ui-surface');
  await expect(surface.locator('[data-line-a2ui-placeholder="pending"]')).toHaveCount(0);
  await expect(
    surface.locator(
      ':is(line-alert, line-button, line-button-group, line-icon, line-icon-button, line-separator, line-stack)',
    ),
  ).toHaveCount(SURFACE_STORIES[id]);
  await expect(surface).not.toHaveAttribute('aria-busy', 'true');
}

test('the Storybook index lists exactly these surface stories', async ({ request }) => {
  const response = await request.get(`${STORYBOOK_ORIGIN}/index.json`);
  const { entries } = (await response.json()) as { entries: Record<string, { type: string; importPath: string }> };
  const ids = Object.entries(entries)
    .filter(([, entry]) => entry.type === 'story' && entry.importPath === './stories/agent-ui/a2ui-surface.stories.ts')
    .map(([id]) => id);
  expect(ids.sort()).toEqual(Object.keys(SURFACE_STORIES).sort());
});

for (const id of Object.keys(SURFACE_STORIES) as SurfaceStoryId[]) {
  test(`${id} has zero axe violations`, async ({ page }) => {
    await openSurfaceStory(page, id);
    await expectNoAxeViolations(axe(page).include('#storybook-root'));
  });
}

for (const id of ['agent-ui-a2ui-surface--list', 'agent-ui-a2ui-surface--mixed-list'] as const) {
  test(`${id} passes the list rules on the role="list" host and its items`, async ({ page }) => {
    await openSurfaceStory(page, id);
    const { passes, violations } = await axe(page)
      .include('#storybook-root')
      .withRules(['aria-required-children', 'aria-required-parent'])
      .analyze();
    expect(violations.map((violation) => violation.id)).toEqual([]);
    const passed = Object.fromEntries(passes.map((rule) => [rule.id, rule.nodes.length]));
    const items = await page.locator('#storybook-root [role="listitem"]').count();
    expect(passed['aria-required-children']).toBeGreaterThanOrEqual(1);
    expect(passed['aria-required-parent']).toBe(items);
  });
}

test('the Line catalog story renders the IconButton named by its accessibility.label', async ({ page }) => {
  await openSurfaceStory(page, 'agent-ui-a2ui-surface--line-catalog');
  const iconButton = page.locator('#storybook-root line-a2ui-surface line-icon-button[aria-label="Close"]');
  await expect(iconButton).toHaveAttribute('aria-label', 'Close');
  await expect(iconButton.getByRole('button')).toHaveAccessibleName('Close');
  await expect(iconButton.locator('line-icon svg')).toHaveCount(1);
});

test('the Line catalog story renders the ButtonGroup as a named toolbar that roves over its buttons', async ({
  page,
  browserName,
}) => {
  await openSurfaceStory(page, 'agent-ui-a2ui-surface--line-catalog');
  const group = page.locator('#storybook-root line-a2ui-surface line-button-group');
  await expect(group).toHaveAttribute('aria-label', 'Zoom');
  await expect(group).toHaveAttribute('loop', '');
  const stops = () =>
    group.evaluate((el) =>
      [...el.children].map(
        (child) => `${child.getAttribute('tabindex')}:${child.getAttribute('data-line-button-group-position')}`,
      ),
    );
  expect(await stops()).toEqual(['0:first', '-1:middle', '-1:last']);
  await group.locator('line-icon-button').first().focus();
  await page.keyboard.press('ArrowLeft');
  expect(await stops()).toEqual(['-1:first', '-1:middle', '0:last']);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(focused, browserName).toBe('Zoom in');
});

test('the Line catalog story renders the Alert with its five zones, its tone and no live role', async ({ page }) => {
  await openSurfaceStory(page, 'agent-ui-a2ui-surface--line-catalog');
  const alert = page.locator('#storybook-root line-a2ui-surface line-alert');
  await expect(alert).toHaveAttribute('variant', 'danger');
  const view = await alert.evaluate((el) => ({
    attributes: el.getAttributeNames().sort(),
    slotted: [...el.children].map((child) => `${child.localName}:${child.getAttribute('slot')}`),
    zones: ['icon', 'title', 'description', 'actions', 'dismiss'].filter(
      (zone) => getComputedStyle(el.shadowRoot?.querySelector(`[part="${zone}"]`) as Element).display !== 'none',
    ),
  }));
  expect(view).toEqual({
    attributes: ['variant'],
    slotted: ['line-icon:icon', 'h3:title', 'p:null', 'line-button:actions', 'line-icon-button:dismiss'],
    zones: ['icon', 'title', 'description', 'actions', 'dismiss'],
  });
  await expect(alert.locator('line-button').getByRole('button')).toHaveAccessibleName('Retry');
});

test('the Line catalog Alert hides itself when its dismiss IconButton is activated (AM-006)', async ({ page }) => {
  await openSurfaceStory(page, 'agent-ui-a2ui-surface--line-catalog');
  const alert = page.locator('#storybook-root line-a2ui-surface line-alert');
  await alert.locator('line-icon-button[aria-label="Dismiss"]').click();
  await expect(alert).toHaveAttribute('hidden', '');
  await expect(alert).toBeHidden();
});
