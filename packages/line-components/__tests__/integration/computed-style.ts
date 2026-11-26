/**
 * Shared computed-style helper for the browser tier (row 01-Z14).
 *
 * Chromium 159 (Playwright 1.65.1) implements the CSS Box Alignment keywords `flow-start` and `flow-end`, and
 * serializes the computed value of `flex-start` and `flex-end` as `flow-start` and `flow-end`; layout is unchanged.
 * Firefox 159 and WebKit 27.2 still serialize `flex-start` and `flex-end` (WPT
 * `css/css-align/flow-start-and-end-serialization.html`; crbug.com/555299635). The tests assert the declared
 * `flex-start` and `flex-end`, so they read computed values through this map.
 *
 * @module __tests__/integration/computed-style
 */

const FLOW_TO_FLEX: Readonly<Record<string, string>> = { 'flow-start': 'flex-start', 'flow-end': 'flex-end' };

/** Maps Chromium 159's `flow-start` and `flow-end` serializations back to `flex-start` and `flex-end`. */
export function normalizeAlignment(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [name, FLOW_TO_FLEX[value] ?? value]));
}
