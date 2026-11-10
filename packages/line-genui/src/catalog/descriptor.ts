/**
 * The descriptor API of `@websublime/line-genui/catalog` (Phase 1 spec §6.G.1; ARCH §17.3).
 *
 * A descriptor tells the agent-facing layers how to use one `line-components` component: the catalog emitters
 * (G2), the frontend-tool walker (G3), the surface `<line-a2ui-surface>` (G4) and the manifest drift test (G5).
 * Its prop schema is a Zod 3 object that reuses the `@a2ui/web_core` v0.9 common types, so a descriptor is also a
 * web_core `ComponentApi` (`name`, `schema`) that a `Catalog` takes as it is.
 *
 * @module catalog/descriptor
 */

import { spec } from '@a2ui/web_core/catalog';
import {
  AccessibilityAttributesSchema,
  ActionSchema,
  ChildListSchema,
  ComponentIdSchema,
  DynamicBooleanSchema,
  DynamicNumberSchema,
  DynamicStringSchema,
} from '@a2ui/web_core/v0_9';
import { z } from 'zod';

/** The `web_core` common types a descriptor prop may take, by their `$defs` name in `common_types.json`. */
const COMMON_TYPES = {
  DynamicString: DynamicStringSchema,
  DynamicBoolean: DynamicBooleanSchema,
  DynamicNumber: DynamicNumberSchema,
  ComponentId: ComponentIdSchema,
  ChildList: ChildListSchema,
  Action: ActionSchema,
} as const;

/** The name of a `web_core` common type, as `common_types.json` declares it under `$defs`. */
export type CommonTypeName = keyof typeof COMMON_TYPES;

/**
 * Returns the `web_core` common type `type` carrying the property description `description`.
 *
 * The description goes through the `REF:` marker, `REF:#/$defs/<type>|<description>`, so `Catalog.toJson()`
 * writes a `$ref` to the common type with the description beside it. The upstream helpers write a literal
 * `${description}` instead, and `childList()` drops the marker; plain `.describe()` on a common type would inline
 * its `oneOf` (§6.G.1 Contract; §10 SD41; §12 AM-066). An enum or another plain prop takes plain `.describe()`.
 *
 * @param type The common type.
 * @param description The agent-facing description of the property.
 * @returns A copy of the common type's schema with the description; it validates exactly as the common type.
 */
export function commonProp<K extends CommonTypeName>(type: K, description: string): (typeof COMMON_TYPES)[K] {
  return COMMON_TYPES[type].describe(`REF:#/$defs/${type}|${description}`) as (typeof COMMON_TYPES)[K];
}

/** The `accessibility` prop every descriptor declares, as the upstream basic components do. */
const accessibilityProp = AccessibilityAttributesSchema.describe('REF:#/$defs/AccessibilityAttributes').optional();

/** The prop schema of a descriptor whose own props are `Shape`. */
export type DescriptorSchema<Shape extends z.ZodRawShape> = z.ZodObject<
  { accessibility: typeof accessibilityProp } & Shape,
  'strict'
>;

/**
 * Returns the prop schema of a component: a strict Zod 3 object of `props` plus the A2UI `accessibility` object,
 * described by the component description and annotated with the `ComponentCommon` mixin.
 *
 * `toJson()` keeps a component description only on a schema annotated through `spec(…, { mixins })`, and the
 * mixin gives the node the A2UI `accessibility` object, through which an agent names it (§6.G.1 Contract;
 * §12 AM-067). The object also declares `accessibility` itself, so a Zod parse neither strips nor rejects it.
 *
 * @param description The agent-facing component description.
 * @param props The component's own props.
 */
export function componentSchema<Shape extends z.ZodRawShape>(
  description: string,
  props: Shape,
): DescriptorSchema<Shape> {
  const schema = z
    .object({ accessibility: accessibilityProp, ...props })
    .strict()
    .describe(description) as DescriptorSchema<Shape>;
  return spec(schema, { mixins: ['ComponentCommon'] });
}

/** An attribute or property of the component's element. */
export type ElementMember =
  | { readonly kind: 'attribute'; readonly name: string }
  | { readonly kind: 'property'; readonly name: string };

/**
 * A surface lookup: the prop's value keys the surface property `surfaceProperty`, and the entry found sets the
 * element members `sets`, as Icon `name` → `iconMap` sets `library`, `name`, `weight` and `mirror` (§6.G.4
 * "`line` catalog Icon"; §12 AM-071). The drift test checks `sets`, not `surfaceProperty`, against the element's
 * manifest (§12 AM-072).
 */
export interface SurfaceLookup<P extends string> {
  readonly kind: 'surfaceLookup';
  readonly surfaceProperty: string;
  readonly sets: readonly ElementMember[];
  /** Props that take precedence: when the node carries one of them, the surface skips the lookup. */
  readonly skippedWhen: readonly P[];
}

/**
 * A text binding: the surface writes the prop's resolved string as the host's text content, so it lands in the
 * default slot, as Chip `label` does. It names no element member, so the drift test skips it, and a descriptor with
 * one has no slot map (§6.G.1 Fields, §6.G.5; §12 AM-092).
 */
export interface TextBinding {
  readonly kind: 'text';
}

/** Where the surface writes a prop: an element attribute or property, a surface lookup, or the host's text. */
export type Binding<P extends string> = ElementMember | SurfaceLookup<P> | TextBinding;

/** The binding map: each bound prop's target, and the value prop with its commit event (ARCH §17.2 rule C9). */
export interface BindingMap<P extends string> {
  readonly props: { readonly [K in P]?: Binding<P> };
  /** The prop the component writes back, and the event that commits it; absent when the component has none. */
  readonly value?: { readonly prop: P; readonly commitEvent: string };
}

/** The slot map: prop → slot name the surface wires the prop's children into, `''` for the default slot. */
export type SlotMap<P extends string> = { readonly [K in P]?: string };

/**
 * The action map: prop → DOM event that runs the prop's action. A native event, which the browser dispatches and
 * the manifest does not list, such as Button's `click`, is marked `native` (§6.G.1 Contract; §12 AM-067).
 */
export type ActionMap<P extends string> = {
  readonly [K in P]?: { readonly event: string; readonly native: boolean };
};

/**
 * A source of a required accessible name: the text of the component a child prop names, the string of a
 * text-binding prop, or an A2UI `accessibility.label`. Each counts when non-empty after trimming whitespace
 * (§6.G.4 Accessibility; §12 AM-092).
 */
export type NameSource<P extends string> =
  | { readonly kind: 'childText'; readonly prop: P }
  | { readonly kind: 'textProp'; readonly prop: P }
  | { readonly kind: 'accessibilityLabel' };

/**
 * When the surface sets a node's `accessibility.label` and `.description` as the host `aria-label` and
 * `aria-description` (§6.G.4 Accessibility; §12 AM-067, AM-068). A blank value never sets anything.
 *
 * - `always`: on every node.
 * - `never`: on no node, as on Icon (`0014-icon.md` decision D1).
 * - `listRole`: only when the surface also sets `role="list"` on the host, as on Stack for A2UI `List`.
 * - `unlessTrue`: except while the resolved value of `prop` is true, re-evaluated when its binding changes, as
 *   Separator's `decorative`.
 */
export type HostNaming<P extends string> =
  | { readonly kind: 'always' }
  | { readonly kind: 'never' }
  | { readonly kind: 'listRole' }
  | { readonly kind: 'unlessTrue'; readonly prop: P };

/** The accessibility requirements the surface checks and applies (§6.G.1 Contract; §10 SD36). */
export interface AccessibilityRequirements<P extends string> {
  /**
   * The sources of the required accessible name, any one of which names the node; absent when the component
   * requires no name. The surface renders a node with none of them as a placeholder and raises `line-a2ui-error`.
   */
  readonly requiredName?: readonly NameSource<P>[];
  readonly hostNaming: HostNaming<P>;
}

/** Whether the emitters expose a descriptor to agents; `false` carries the reason (§6.G.1 Contract). */
export type AgentExposure =
  | { readonly agentExposed: true }
  | { readonly agentExposed: false; readonly agentHiddenReason: string };

/** The fields every descriptor carries, `Shape` being its own props (§6.G.1 Fields). */
export interface DescriptorFields<Shape extends z.ZodRawShape> {
  /** The catalog name, such as `Button`. */
  readonly name: string;
  /** The element's tag, such as `line-button`. */
  readonly tag: string;
  /**
   * Imports the component's subpath, which defines the element. It is a dynamic import, so importing `./catalog`
   * defines no element and the surface loads each component only when a node needs it (ARCH §17.4).
   */
  readonly load: () => Promise<unknown>;
  /** The agent-facing component description, which the `line` catalog carries. */
  readonly description: string;
  /**
   * The tool description: when set, the frontend-tool emitter takes it as the tool `description` in place of
   * `description`, and the catalogs never read it. Set it when `description` names, in backticks, a prop the tool
   * leaves out (a `ComponentId`, `ChildList` or `Action` prop) or a member of `accessibility`; it names no parameter
   * the tool lacks (§6.G.1 Fields; §6.G.3; §12 AM-086).
   */
  readonly toolDescription?: string;
  readonly schema: DescriptorSchema<Shape>;
  readonly slots: SlotMap<keyof Shape & string>;
  readonly bindings: BindingMap<keyof Shape & string>;
  readonly actions: ActionMap<keyof Shape & string>;
  readonly accessibility: AccessibilityRequirements<keyof Shape & string>;
}

/** A component descriptor. */
export type LineDescriptor<Shape extends z.ZodRawShape = z.ZodRawShape> = DescriptorFields<Shape> & AgentExposure;

/** What {@link defineDescriptor} takes: the fields, with `props` in place of `schema` and `agentExposed` optional. */
export type DescriptorInit<Shape extends z.ZodRawShape> = Omit<DescriptorFields<Shape>, 'schema'> & {
  /** The component's own props; {@link componentSchema} builds the schema from them and `description`. */
  readonly props: Shape;
} & (
    | { readonly agentExposed?: true; readonly agentHiddenReason?: never }
    | { readonly agentExposed: false; readonly agentHiddenReason: string }
  );

/**
 * Builds a descriptor. The schema comes from `props` and `description` through {@link componentSchema}, and
 * `agentExposed` defaults to `true`; `false` requires `agentHiddenReason` (§6.G.1 Contract). The descriptor carries
 * `toolDescription` only when `init` sets it (§12 AM-086).
 *
 * @param init The descriptor fields.
 */
export function defineDescriptor<Shape extends z.ZodRawShape>(init: DescriptorInit<Shape>): LineDescriptor<Shape> {
  const { props, agentExposed, agentHiddenReason, toolDescription, ...fields } = init;
  const schema = componentSchema(fields.description, props);
  const tool = toolDescription === undefined ? {} : { toolDescription };
  return agentExposed === false
    ? { ...fields, ...tool, schema, agentExposed, agentHiddenReason }
    : { ...fields, ...tool, schema, agentExposed: true };
}
