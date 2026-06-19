/**
 * Metadata mixin unit tests (D3, spec §6.D.3).
 *
 * The Metadata mixin declares the four static metadata members
 * (`version`, `docs`, `qa`, `scope`) every line://ui component carries.
 * Surfacing them as host attributes is the Inspector mixin's (D2) job — this
 * suite asserts ONLY the declaration contract:
 *   1. defaults are present on a bare host;
 *   2. component overrides take precedence;
 *   3. the members survive mixin composition and stay readable off the
 *      constructor (the shape the Inspector reads defensively).
 *
 * Note: lit-html cannot interpolate a tag name into element position
 * (`<${tag}>` is parsed as text, not an element), so fixtures use static `html`
 * templates with the literal tags registered below.
 *
 * Runs on F2's harness: `bun-test-preload.ts` registers happy-dom globally and
 * wires `@open-wc/testing-helpers` `fixtureCleanup` afterEach.
 *
 * @module __tests__/metadata
 */

import { describe, expect, test } from 'bun:test';
import { fixture, html } from '@open-wc/testing-helpers';
import { LitElement } from 'lit';
import { MetadataMixin } from '../src/mixins/metadata.js';

/** Bare host with the metadata mixin only — exercises the defaults. */
class BareMetadataHost extends MetadataMixin(LitElement) {}

/** Host overriding every metadata member (the component-author contract). */
class FullMetadataHost extends MetadataMixin(LitElement) {
  static override version = '1.2.3';
  static override docs = 'https://example.test/docs';
  static override qa: string[] = ['stable', 'a11y'];
  static override scope = 'forms';
}

customElements.define('metadata-host-bare', BareMetadataHost);
customElements.define('metadata-host-full', FullMetadataHost);

/** Read a static member off the host's constructor, the way the Inspector does. */
function ctor<T>(el: Element, key: string): T {
  return (el.constructor as unknown as Record<string, T>)[key] as T;
}

describe('MetadataMixin', () => {
  test('provides metadata defaults on a bare host', async () => {
    const el = await fixture(html`<metadata-host-bare></metadata-host-bare>`);
    expect(ctor<string>(el, 'version')).toBe('0.0.0');
    expect(ctor<string>(el, 'docs')).toBe('');
    expect(ctor<string[]>(el, 'qa')).toEqual([]);
    expect(ctor<string>(el, 'scope')).toBe('');
  });

  test('honours component overrides for every member', async () => {
    const el = await fixture(html`<metadata-host-full></metadata-host-full>`);
    expect(ctor<string>(el, 'version')).toBe('1.2.3');
    expect(ctor<string>(el, 'docs')).toBe('https://example.test/docs');
    expect(ctor<string[]>(el, 'qa')).toEqual(['stable', 'a11y']);
    expect(ctor<string>(el, 'scope')).toBe('forms');
  });

  test('exposes the members statically on the composed class (no instance needed)', () => {
    // The Inspector reads `this.constructor.version` etc. — assert the same
    // surface is present directly on the class.
    expect(BareMetadataHost.version).toBe('0.0.0');
    expect(BareMetadataHost.docs).toBe('');
    expect(BareMetadataHost.qa).toEqual([]);
    expect(BareMetadataHost.scope).toBe('');
    expect(FullMetadataHost.qa).toEqual(['stable', 'a11y']);
  });

  test('qa is a distinct array per host class (no shared mutable default)', () => {
    expect(BareMetadataHost.qa).not.toBe(FullMetadataHost.qa);
    expect(FullMetadataHost.scope).toBe('forms');
    // The bare host keeps its empty default regardless of subclass overrides.
    expect(BareMetadataHost.qa).toEqual([]);
  });
});
