/**
 * Hello-world integration test — bun tier (D8, spec §6.D.8, §9.4).
 *
 * Platform smoke on the F2 harness (happy-dom + `@open-wc/testing-helpers`):
 * the component mounts, the machine drives the rendered state, a click sends
 * `TOGGLE` and the transition reaches the DOM, and the D7 reset sheet reached
 * the shadow root through the `?inline` preload plugin (AM-026).
 *
 * @module __tests__/integration/hello-world/line-hello-world.test
 */

import { describe, expect, test } from 'bun:test';
import { fixture, html, waitUntil } from '@open-wc/testing-helpers';
import { commonReset } from '../../../src/styles/index.js';
import { LineHelloWorld } from './line-hello-world.js';

const root = (el: LineHelloWorld) => el.shadowRoot?.querySelector('[part="root"]');
const trigger = (el: LineHelloWorld) => el.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]');

describe('<line-hello-world> (D8)', () => {
  test('mounts in idle and toggles to active on click', async () => {
    const el = await fixture<LineHelloWorld>(html`<line-hello-world></line-hello-world>`);
    expect(el).toBeInstanceOf(LineHelloWorld);
    expect(el.ctrl.fallback).toBe(false);
    expect(root(el)?.getAttribute('data-state')).toBe('idle');
    expect(trigger(el)?.textContent?.trim()).toBe('idle');

    trigger(el)?.click();
    // `VanillaMachine.send` dispatches on a microtask; await the rendered transition, not a guessed delay.
    await waitUntil(() => root(el)?.getAttribute('data-state') === 'active', 'TOGGLE never rendered active');
    expect(trigger(el)?.textContent?.trim()).toBe('active');
  });

  test('adopts commonReset in its shadow root', async () => {
    const el = await fixture<LineHelloWorld>(html`<line-hello-world></line-hello-world>`);
    expect(el.shadowRoot?.adoptedStyleSheets).toContain(commonReset);
  });
});
