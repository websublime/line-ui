/**
 * The `basic` implementation map: the line://ui targets of the A2UI basic catalog types Phase 1 maps, which the
 * `<line-a2ui-surface>` session registers under the v0_9 basic catalog id (Phase 1 spec §6.G.2, §6.G.4 Basic
 * mapping; §10 SD43; ARCH §17.3).
 *
 * line does not re-emit the basic JSON Schema: each entry carries the `web_core` `ComponentApi` of its type, whose
 * schema is A2UI's own (ARCH §17.3).
 *
 * @module catalog/basic
 */

import type { ComponentApi } from '@a2ui/web_core/catalog';
import {
  AudioPlayerApi,
  ButtonApi,
  ColumnApi,
  DividerApi,
  IconApi,
  ImageApi,
  ListApi,
  RowApi,
  TextApi,
  VideoApi,
} from '@a2ui/web_core/v0_9';
import type { LineDescriptor } from './descriptor.js';
import { buttonDescriptor } from './descriptors/button.js';
import { iconDescriptor } from './descriptors/icon.js';
import { separatorDescriptor } from './descriptors/separator.js';
import { stackDescriptor } from './descriptors/stack.js';

/**
 * The A2UI basic catalog id, the only one `web_core` 0.14.0 knows for v0.9; it throws `Catalog not found` on the
 * `v0_9_1` id (R1 §2.6; §10 SD43; §12 AM-073).
 */
export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

/** The basic types Phase 1 maps, 10 of the 18 (ARCH §17.3 table). */
export type BasicTypeName =
  | 'Text'
  | 'Image'
  | 'Icon'
  | 'Video'
  | 'AudioPlayer'
  | 'Row'
  | 'Column'
  | 'List'
  | 'Divider'
  | 'Button';

/** The `variant` values of the basic `Text`. */
export type BasicTextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'caption' | 'body';

/** Fixed attributes a target element takes for its basic type, such as `controls` on `<audio>`. */
export type TargetAttributes = Readonly<Record<string, string>>;

/**
 * Where the surface renders a basic type.
 *
 * - `native`: a native media element. `url` names the use the URL policy checks its URL under (§6.G.4 URLs).
 * - `text`: a native text element chosen by `variant`, or `inButton` when the Text is a Button's child (§10 SD59).
 * - `component`: the line://ui component of `descriptor`, which gives its tag, `load()` and accessibility
 *   requirements, with `attributes` set on top of those the node's props bind.
 */
export type BasicTarget =
  | {
      readonly kind: 'native';
      readonly tag: 'img' | 'video' | 'audio';
      readonly url: 'image' | 'video' | 'audio';
      readonly attributes: TargetAttributes;
    }
  | {
      readonly kind: 'text';
      readonly tagByVariant: Readonly<Record<BasicTextVariant, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'small' | 'p'>>;
      readonly inButton: 'span';
    }
  | { readonly kind: 'component'; readonly descriptor: LineDescriptor; readonly attributes: TargetAttributes };

/** One basic type's implementation: its `web_core` v0.9 `ComponentApi` and its line://ui target. */
export interface BasicImplementation {
  readonly api: ComponentApi;
  readonly target: BasicTarget;
}

/**
 * The `basic` implementation map, keyed by basic type name. It is frozen and has a `null` prototype, so look a
 * type up with `Object.hasOwn`: a type it lacks is unmapped, and the surface renders an inert placeholder for it
 * and raises `line-a2ui-error` (ARCH §17.3).
 */
export type BasicImplementationMap = Readonly<Record<BasicTypeName, BasicImplementation>>;

const NONE: TargetAttributes = Object.freeze({});

const IMPLEMENTATIONS: Record<BasicTypeName, BasicImplementation> = {
  Text: {
    api: TextApi,
    target: {
      kind: 'text',
      tagByVariant: { h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', caption: 'small', body: 'p' },
      inButton: 'span',
    },
  },
  // Every `variant` renders `<img>` until C10 routes `variant: "avatar"` to `<line-avatar>` (§6.G.2; AM-021).
  Image: { api: ImageApi, target: { kind: 'native', tag: 'img', url: 'image', attributes: NONE } },
  Icon: { api: IconApi, target: { kind: 'component', descriptor: iconDescriptor, attributes: NONE } },
  Video: { api: VideoApi, target: { kind: 'native', tag: 'video', url: 'video', attributes: NONE } },
  AudioPlayer: {
    api: AudioPlayerApi,
    target: { kind: 'native', tag: 'audio', url: 'audio', attributes: { controls: '' } },
  },
  Row: {
    api: RowApi,
    target: { kind: 'component', descriptor: stackDescriptor, attributes: { orientation: 'horizontal' } },
  },
  Column: {
    api: ColumnApi,
    target: { kind: 'component', descriptor: stackDescriptor, attributes: { orientation: 'vertical' } },
  },
  // A List's `line-stack` carries `role="list"`, and each item `role="listitem"` (§6.G.4 Accessibility; SD59).
  List: { api: ListApi, target: { kind: 'component', descriptor: stackDescriptor, attributes: { role: 'list' } } },
  Divider: { api: DividerApi, target: { kind: 'component', descriptor: separatorDescriptor, attributes: NONE } },
  Button: { api: ButtonApi, target: { kind: 'component', descriptor: buttonDescriptor, attributes: NONE } },
};

/** Freezes a target with its attribute or variant table; the descriptor stays as it is. */
function freezeTarget(target: BasicTarget): BasicTarget {
  if (target.kind === 'text') Object.freeze(target.tagByVariant);
  else Object.freeze(target.attributes);
  return Object.freeze(target);
}

const BASIC_IMPLEMENTATIONS: BasicImplementationMap = Object.freeze(
  Object.assign(
    Object.create(null) as Record<BasicTypeName, BasicImplementation>,
    Object.fromEntries(
      Object.entries(IMPLEMENTATIONS).map(([name, { api, target }]) => [
        name,
        Object.freeze({ api, target: freezeTarget(target) }),
      ]),
    ),
  ),
);

/**
 * Returns the `basic` implementation map registered under `catalogId`: the map for the v0_9 basic catalog id
 * {@link BASIC_CATALOG_ID}, and `undefined` for every other id, the `v0_9_1` and v1.0 basic ids included
 * (§10 SD43). The session registers it always (§6.G.4).
 *
 * @param catalogId The catalog id of a surface.
 */
export function basicImplementations(catalogId: string): BasicImplementationMap | undefined {
  return catalogId === BASIC_CATALOG_ID ? BASIC_IMPLEMENTATIONS : undefined;
}
