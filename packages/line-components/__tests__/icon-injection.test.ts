/**
 * `<line-icon>` SVG injection, unit tier (spec `0014-icon.md` SVG injection and Tests; Phase 1 spec §6.C.3
 * "SVG injection" and its acceptance; §10 SD91, SD95, SD97).
 *
 * Calls `injectSvg` from `src/icon/svg-injection.ts` on happy-dom. happy-dom has no Trusted Types, so the
 * policy cases install a recording `trustedTypes` and load a fresh copy of the module through a query suffix,
 * because the policy guard lives at module level. The engines' own parsers are proved in the browser tier.
 *
 * @module __tests__/icon-injection
 */

import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type * as InjectionModule from '../src/icon/svg-injection.js';
import { injectSvg } from '../src/icon/svg-injection.js';

const require = createRequire(import.meta.url);
const LUCIDE_HOUSE = readFileSync(
  join(dirname(require.resolve('lucide-static/package.json')), 'icons', 'house.svg'),
  'utf8',
);

const SVG_NS = 'http://www.w3.org/2000/svg';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';

/** The spec allowlists (Phase 1 spec §6.C.3), restated so a change to the source fails here. */
const ALLOWED_ELEMENTS = ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'];
const ALLOWED_ATTRIBUTES = [
  ...['class', 'cx', 'cy', 'd', 'fill', 'height', 'opacity', 'points', 'r', 'rx', 'ry', 'stroke'],
  ...['stroke-linecap', 'stroke-linejoin', 'stroke-width', 'viewBox', 'width', 'x', 'x1', 'x2', 'y', 'y1', 'y2'],
  ...['transform', 'fill-rule', 'clip-rule', 'fill-opacity', 'stroke-opacity', 'stroke-dasharray'],
  ...['stroke-dashoffset', 'stroke-miterlimit', 'vector-effect', 'shape-rendering'],
  ...['aria-hidden', 'role', 'focusable'],
];
const NEVER_ELEMENTS = [
  ...['script', 'style', 'foreignObject', 'use', 'a', 'image', 'defs', 'clipPath', 'mask'],
  ...['linearGradient', 'radialGradient', 'pattern'],
];

const svg = (inner: string, attributes = ''): string => `<svg xmlns="${SVG_NS}"${attributes}>${inner}</svg>`;

/** Attributes as `name=value`, in document order. */
const attributesOf = (element: Element | null | undefined): string[] =>
  [...(element?.attributes ?? [])].map((attribute) => `${attribute.name}=${attribute.value}`);

/** Every element of the tree as `localName`, depth first. */
const elementsOf = (root: Element | undefined): string[] =>
  root ? [root.localName, ...[...root.querySelectorAll('*')].map((element) => element.localName)] : [];

describe('injectSvg — allowlist', () => {
  test('script, foreignObject, <a href="javascript:…">, on* and style are all removed', () => {
    const root = injectSvg(
      svg(
        `<script>alert(1)</script>
        <foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject>
        <a href="javascript:alert(1)"><path d="M1 1"/></a>
        <path d="M0 0" onclick="alert(1)" onload="alert(1)" style="fill: red"/>`,
        ' onload="alert(1)" style="color: red" viewBox="0 0 24 24"',
      ),
    );
    expect(elementsOf(root)).toEqual(['svg', 'path']);
    expect(attributesOf(root)).toEqual([
      'xmlns=http://www.w3.org/2000/svg',
      'viewBox=0 0 24 24',
      'part=svg',
      'aria-hidden=true',
    ]);
    expect(attributesOf(root?.querySelector('path'))).toEqual(['d=M0 0']);
  });

  test('<use href="#x"> and fill="url(#x)" are removed, in any letter case', () => {
    const root = injectSvg(
      svg(
        `<use href="#x"/><path d="M0 0" fill="url(#x)"/><path d="M1 1" stroke="URL(#y)" fill="Url( #z)"/>
        <rect x="1" y="1" width="2" height="2" fill="red"/>`,
      ),
    );
    expect(elementsOf(root)).toEqual(['svg', 'path', 'path', 'rect']);
    const [first, second] = [...(root?.querySelectorAll('path') ?? [])];
    expect(attributesOf(first)).toEqual(['d=M0 0']);
    expect(attributesOf(second)).toEqual(['d=M1 1']);
    expect(root?.querySelector('rect')?.getAttribute('fill')).toBe('red');
  });

  test('g with transform and path with fill-rule="evenodd" survive intact', () => {
    const root = injectSvg(
      svg('<g transform="translate(2 2) rotate(45)"><path d="M0 0h10v10H0z" fill-rule="evenodd"/></g>'),
    );
    expect(elementsOf(root)).toEqual(['svg', 'g', 'path']);
    expect(attributesOf(root?.querySelector('g'))).toEqual(['transform=translate(2 2) rotate(45)']);
    expect(attributesOf(root?.querySelector('path'))).toEqual(['d=M0 0h10v10H0z', 'fill-rule=evenodd']);
  });

  test('every never-pass element drops with its subtree', () => {
    const inner = NEVER_ELEMENTS.map((name) => `<${name}><path d="M0 0"/></${name}>`).join('');
    const root = injectSvg(svg(`${inner}<circle cx="1" cy="1" r="1"/>`));
    expect(elementsOf(root)).toEqual(['svg', 'circle']);
  });

  test('every allowlisted element and attribute passes', () => {
    const allAttributes = ALLOWED_ATTRIBUTES.map((name) => `${name}="1"`).join(' ');
    const inner = ALLOWED_ELEMENTS.map((name) => `<${name} ${allAttributes}/>`).join('');
    const root = injectSvg(svg(inner));
    expect(elementsOf(root)).toEqual(['svg', ...ALLOWED_ELEMENTS]);
    for (const element of root?.children ?? []) {
      // The injected root sets `aria-hidden` itself; on the children every attribute keeps its source value.
      expect(attributesOf(element)).toEqual(ALLOWED_ATTRIBUTES.map((name) => `${name}=1`));
    }
  });

  test('names off the allowlist, namespaced attributes and elements outside the SVG namespace drop', () => {
    const root = injectSvg(
      svg(
        `<path d="M0 0" data-x="1" id="a" href="#b" mask="m" xml:space="preserve" xlink:href="#c"/>
        <html:path xmlns:html="http://www.w3.org/1999/xhtml" d="M1 1"/>
        <other:g xmlns:other="urn:other"><path d="M2 2"/></other:g>
        <title>Name</title><desc>Text</desc><text>Hi</text>`,
        ' xmlns:xlink="http://www.w3.org/1999/xlink"',
      ),
    );
    expect(elementsOf(root)).toEqual(['svg', 'path']);
    expect(attributesOf(root?.querySelector('path'))).toEqual(['d=M0 0']);
  });

  test('text, comment and processing-instruction nodes are not copied', () => {
    // happy-dom reports CDATA in an SVG document as a parse error; the browser tier covers CDATA.
    const root = injectSvg(svg('text<!-- c --><?pi y?><path d="M0 0"/>tail'));
    expect([...(root?.childNodes ?? [])].map((node) => node.nodeName)).toEqual(['path']);
  });

  test('xmlns:xlink is removed and the root xmlns is kept', () => {
    const root = injectSvg(svg('<path d="M0 0"/>', ' xmlns:xlink="http://www.w3.org/1999/xlink"'));
    expect(root?.getAttributeNodeNS(XMLNS_NS, 'xmlns')?.value).toBe(SVG_NS);
    expect(root?.getAttributeNames().filter((name) => name.startsWith('xmlns:'))).toEqual([]);
  });

  test('the result is a new tree in the page document, in the SVG namespace', () => {
    const root = injectSvg(svg('<path d="M0 0"/>'));
    expect(root?.ownerDocument).toBe(document);
    expect(root?.namespaceURI).toBe(SVG_NS);
    expect(root?.querySelector('path')?.namespaceURI).toBe(SVG_NS);
  });

  test('Lucide house renders intact, without its license comment', () => {
    const root = injectSvg(LUCIDE_HOUSE);
    expect(attributesOf(root)).toEqual([
      'class=lucide lucide-house',
      'xmlns=http://www.w3.org/2000/svg',
      'width=24',
      'height=24',
      'viewBox=0 0 24 24',
      'fill=none',
      'stroke=currentColor',
      'stroke-width=2',
      'stroke-linecap=round',
      'stroke-linejoin=round',
      'part=svg',
      'aria-hidden=true',
    ]);
    expect([...(root?.childNodes ?? [])].map((node) => node.nodeName)).toEqual(['path', 'path']);
    expect([...(root?.children ?? [])].map((path) => attributesOf(path))).toEqual([
      ['d=M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'],
      ['d=M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    ]);
  });
});

describe('injectSvg — root and semantics', () => {
  test('the root gets part="svg" and aria-hidden="true"; a source role="img" stays', () => {
    const root = injectSvg(svg('<path d="M0 0"/>', ' role="img"'));
    expect(root?.getAttribute('role')).toBe('img');
    expect(root?.getAttribute('part')).toBe('svg');
    expect(root?.getAttribute('aria-hidden')).toBe('true');
  });

  test('a source aria-hidden="false" on the root is overwritten to "true"', () => {
    expect(injectSvg(svg('<path d="M0 0"/>', ' aria-hidden="false"'))?.getAttribute('aria-hidden')).toBe('true');
  });

  for (const [label, markup] of [
    ['an HTML document', '<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>'],
    ['an svg root without the SVG namespace', '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>'],
    ['an svg root in another namespace', '<svg xmlns="urn:other"><path d="M0 0"/></svg>'],
    ['a parse error', `<svg xmlns="${SVG_NS}"><path></svg`],
    ['plain text', 'not markup'],
    ['an empty string', ''],
  ] as const) {
    test(`${label} returns undefined`, () => {
      expect(injectSvg(markup)).toBeUndefined();
    });
  }
});

/** A recording `trustedTypes` that refuses every policy when `refuse` is set. */
function installTrustedTypes(refuse: boolean) {
  const created: { name: string; createHTML(input: string): string }[] = [];
  const factory = {
    createPolicy(name: string, rules: { createHTML(input: string): string }) {
      if (refuse) {
        throw new TypeError(`Policy "${name}" disallowed.`);
      }
      const policy = { name, createHTML: (input: string) => rules.createHTML(input) };
      created.push(policy);
      return policy;
    },
  };
  const createPolicy = spyOn(factory, 'createPolicy');
  Reflect.set(globalThis, 'trustedTypes', factory);
  return { created, createPolicy };
}

describe('injectSvg — Trusted Types policy', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'trustedTypes');
  });

  test('the line-icon policy is created on the first string, once, and feeds DOMParser', async () => {
    const { created, createPolicy } = installTrustedTypes(false);
    // A query suffix loads a fresh module copy, so its policy guard starts unset.
    const copy = (await import('../src/icon/svg-injection.ts?trusted-types-allowed')) as typeof InjectionModule;
    expect(createPolicy).not.toHaveBeenCalled();
    const parse = spyOn(DOMParser.prototype, 'parseFromString');
    try {
      const markup = svg('<path d="M0 0"/>');
      expect(copy.injectSvg(markup)?.querySelector('path')?.getAttribute('d')).toBe('M0 0');
      expect(copy.injectSvg(markup)).toBeDefined();
      expect(createPolicy).toHaveBeenCalledTimes(1);
      expect(created.map((policy) => policy.name)).toEqual(['line-icon']);
      expect(created[0]?.createHTML(markup)).toBe(markup);
      expect(parse.mock.calls.map(([input, type]) => [input, type])).toEqual([
        [markup, 'image/svg+xml'],
        [markup, 'image/svg+xml'],
      ]);
    } finally {
      parse.mockRestore();
    }
  });

  test('a refused policy leaves this string and every later one empty, and asks once', async () => {
    const { createPolicy } = installTrustedTypes(true);
    const copy = (await import('../src/icon/svg-injection.ts?trusted-types-refused')) as typeof InjectionModule;
    const markup = svg('<path d="M0 0"/>');
    expect(copy.injectSvg(markup)).toBeUndefined();
    expect(copy.injectSvg(markup)).toBeUndefined();
    expect(createPolicy).toHaveBeenCalledTimes(1);
  });

  test('without trustedTypes the string goes to DOMParser as is', () => {
    expect(Reflect.get(globalThis, 'trustedTypes')).toBeUndefined();
    expect(injectSvg(svg('<path d="M0 0"/>'))).toBeDefined();
  });
});
