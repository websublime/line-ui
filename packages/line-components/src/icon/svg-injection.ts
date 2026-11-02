/**
 * Turns an SVG string into a new `<svg>` tree that is safe to insert (Phase 1 spec §6.C.3 "SVG injection";
 * §10 SD91, SD95, SD97; spec 0014-icon.md SVG injection).
 *
 * The string passes the Trusted Types policy `line-icon`, `DOMParser` parses it as `image/svg+xml`, and a new
 * tree is built in the page document from the allowlisted elements and attributes only. No parsed node enters
 * the document. Any failure returns `undefined`, which `<line-icon>` renders as its empty state.
 *
 * @module icon/svg-injection
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';

const ELEMENTS: ReadonlySet<string> = new Set([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
]);

const ATTRIBUTES: ReadonlySet<string> = new Set([
  // Measured on every lucide-static and @phosphor-icons/core file.
  'class',
  'cx',
  'cy',
  'd',
  'fill',
  'height',
  'opacity',
  'points',
  'r',
  'rx',
  'ry',
  'stroke',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-width',
  'viewBox',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2',
  // SVG 2 presentation attributes.
  'transform',
  'fill-rule',
  'clip-rule',
  'fill-opacity',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-miterlimit',
  'vector-effect',
  'shape-rendering',
  // Accessibility.
  'aria-hidden',
  'role',
  'focusable',
]);

/** Attributes that never pass, even if a later allowlist names them. `on*` and `url(` are checked apart. */
const NEVER_ATTRIBUTES: ReadonlySet<string> = new Set(['href', 'xlink:href', 'style']);

const URL_FUNCTION = /url\(/i;

/** CSS decodes escapes such as `\75 rl(` after the literal `url(` match, so any backslash drops the value. */
const CSS_ESCAPE = '\\';

/** The part of the Trusted Types API the policy step uses; `lib.dom` declares none of it. */
interface LineIconPolicy {
  /** Returns a `TrustedHTML` in the engine, which `DOMParser.parseFromString` takes where it takes a string. */
  createHTML(input: string): string;
}

interface TrustedTypeFactory {
  createPolicy(name: string, rules: { createHTML(input: string): string }): LineIconPolicy;
}

/** `undefined` until the first string; `null` once `createPolicy` has thrown in this module copy. */
let policy: LineIconPolicy | null | undefined;

/** The string through the `line-icon` policy, the string itself without Trusted Types, or `undefined`. */
function trust(markup: string): string | undefined {
  const factory = Reflect.get(globalThis, 'trustedTypes') as TrustedTypeFactory | undefined;
  if (!factory) {
    return markup;
  }
  if (policy === undefined) {
    try {
      // The allowlist below filters the markup, so the policy passes it through unchanged.
      policy = factory.createPolicy('line-icon', { createHTML: (input) => input });
    } catch {
      policy = null;
    }
  }
  return policy ? policy.createHTML(markup) : undefined;
}

function passes(attribute: Attr): boolean {
  return (
    attribute.namespaceURI === null &&
    ATTRIBUTES.has(attribute.name) &&
    !NEVER_ATTRIBUTES.has(attribute.name) &&
    !attribute.name.startsWith('on') &&
    !URL_FUNCTION.test(attribute.value) &&
    !attribute.value.includes(CSS_ESCAPE)
  );
}

/**
 * A copy of `source` and its allowlisted descendants, or `undefined` when `source` itself does not pass. The
 * default namespace declaration passes on the root only; every `xmlns:*` declaration drops.
 */
function copy(source: Element, root: boolean): SVGElement | undefined {
  if (source.namespaceURI !== SVG_NS || !ELEMENTS.has(source.localName)) {
    return undefined;
  }
  const target = document.createElementNS(SVG_NS, source.localName);
  for (const attribute of source.attributes) {
    if (passes(attribute)) {
      target.setAttribute(attribute.name, attribute.value);
    } else if (root && attribute.namespaceURI === XMLNS_NS && attribute.name === 'xmlns') {
      target.setAttributeNS(XMLNS_NS, 'xmlns', attribute.value);
    }
  }
  for (const child of source.children) {
    const copied = copy(child, false);
    if (copied) {
      target.append(copied);
    }
  }
  return target;
}

/**
 * A new root `<svg>` built from `markup`, with `part="svg"` and `aria-hidden="true"`, or `undefined` when the
 * policy is refused, the markup does not parse, or its root is not an `svg` element in the SVG namespace.
 */
export function injectSvg(markup: string): SVGElement | undefined {
  const trusted = trust(markup);
  if (trusted === undefined) {
    return undefined;
  }
  const parsed = new DOMParser().parseFromString(trusted, 'image/svg+xml');
  const source = parsed.documentElement;
  if (source?.localName !== 'svg' || parsed.getElementsByTagName('parsererror').length > 0) {
    return undefined;
  }
  const root = copy(source, true);
  if (!root) {
    return undefined;
  }
  root.setAttribute('part', 'svg');
  root.setAttribute('aria-hidden', 'true');
  return root;
}
