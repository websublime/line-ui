/**
 * Landing page tier (spec 01 §6.S.1; §7.4; §10 SD71, SD72).
 *
 * Loads the built `apps/site/dist` from the fourth Playwright `webServer` (port 4322) in chromium, firefox and
 * webkit. The registration guard asserts that every `line-*` element on the page is `:defined`, because a section
 * whose `<script>` import goes missing still builds green and leaves its tags unregistered (R12 §2.2). The axe
 * check runs the §7.4 ruleset in light and dark colour schemes and expects zero violations.
 *
 * @module apps/site/__tests__/landing.e2e
 */

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4322' });

/** The §7.4 ruleset, the WCAG 2.0 and 2.1 A and AA tags (§10 SD79). */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Every visible Phase 1 component the page shows; Portal and Presence are not used (§12 AM-109). */
const EXPECTED_TAGS = [
  'line-alert',
  'line-aspect-ratio',
  'line-avatar',
  'line-avatar-group',
  'line-badge',
  'line-button',
  'line-button-group',
  'line-center',
  'line-chip',
  'line-grid',
  'line-icon',
  'line-icon-button',
  'line-kbd',
  'line-separator',
  'line-skeleton',
  'line-spinner',
  'line-stack',
  'line-visually-hidden',
];

test('every line-* element on the page is :defined', async ({ page }) => {
  // Module scripts run before the load event, so every import has settled once `goto` returns.
  await page.goto('/');

  const elements = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((element) => element.localName.startsWith('line-'))
      .map((element) => ({ tag: element.localName, defined: element.matches(':defined') })),
  );

  const tags = [...new Set(elements.map((element) => element.tag))].sort();
  expect(tags, 'the line-* tags on the page').toEqual(EXPECTED_TAGS);

  const undefinedTags = [...new Set(elements.filter((element) => !element.defined).map((element) => element.tag))];
  expect(undefinedTags, 'line-* tags that never registered').toEqual([]);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the page has zero axe violations in the ${colorScheme} scheme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');

    const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    const summary = violations.map(
      (violation) =>
        `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help} — ${violation.nodes
          .map((node) => node.target.join(' >>> '))
          .join(', ')}`,
    );
    expect(summary, 'axe violations (spec §7.4 requires zero)').toEqual([]);
  });
}
