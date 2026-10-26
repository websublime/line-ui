/**
 * axe tier — shared helper (P7, spec §6.P.7, §7.4; §10 SD78, SD79).
 *
 * Wraps `AxeBuilder` from `@axe-core/playwright` with the §7.4 ruleset, the
 * WCAG 2.0 and 2.1 A and AA tags (SD79). The `<c>.e2e.ts` files beside it run
 * in the `chromium`, `firefox` and `webkit` projects of `playwright.config.ts`
 * inside the "Browser tier" step (SD78). The pass condition is zero
 * violations (§7.4). axe skips closed shadow roots and ignores roles set only
 * through `ElementInternals`, so zero violations do not prove such a role has
 * an accessible name (§7.4; R8 §2.4).
 *
 * @module __tests__/a11y/axe
 */

import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from 'playwright/test';

/** The §7.4 ruleset: the axe-core tags every axe-tier run is limited to (SD79). */
export const AXE_TAGS: readonly string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * The fields of an axe-core `Result` the failure message reads. `axe-core` is a transitive
 * dependency of `@axe-core/playwright`, not one of ours, so its type is not imported.
 */
interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  /** Each `target` entry is a selector, or an array of selectors through shadow roots. */
  nodes: readonly { target: readonly (string | readonly unknown[])[] }[];
}

/**
 * Returns an `AxeBuilder` for `page` limited to {@link AXE_TAGS}. Callers may chain
 * `.include()` and `.exclude()` before passing it to {@link expectNoAxeViolations}.
 * `page` must come from a browser context, as the Playwright Test `page` fixture does.
 */
export function axe(page: Page): AxeBuilder {
  return new AxeBuilder({ page }).withTags([...AXE_TAGS]);
}

/** Formats one violation as `id (impact): help — target, target`; shadow-DOM hops print as `host >>> inner`. */
function formatViolation(violation: AxeViolation): string {
  const targets = violation.nodes.map((node) =>
    node.target.map((selector) => (Array.isArray(selector) ? selector.join(' >>> ') : String(selector))).join(' | '),
  );
  return `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help} — ${targets.join(', ')}`;
}

/** Runs `builder` and fails, listing each violation's rule id, impact and targets, unless axe reports zero violations. */
export async function expectNoAxeViolations(builder: AxeBuilder): Promise<void> {
  const { violations } = await builder.analyze();
  expect(violations.map(formatViolation), 'axe violations (spec §7.4 requires zero)').toEqual([]);
}
