/**
 * The frontend-tool emitter of `@websublime/line-genui/catalog` (Phase 1 spec §6.G.3; §10 SD46–SD50; §12 AM-069;
 * ARCH §17.3; PRD Appendix D, Tiers).
 *
 * In the controlled tier the agent picks a component and fills its props through a tool call, and the app renders
 * the call. The emitter turns each agent-exposed descriptor into one tool, `{name, description, parameters}`. A
 * line-owned walker reads the descriptor's Zod 3 prop schema into one flat literal model, and the provider argument
 * serialises that model for OpenAI strict, Anthropic strict or Gemini `parameters`.
 *
 * @module catalog/tools
 */

import { DynamicBooleanSchema, DynamicNumberSchema, DynamicStringSchema } from '@a2ui/web_core/v0_9';
import type { z } from 'zod';
import type { HostNaming, LineDescriptor } from './descriptor.js';

/** The providers the emitter serialises a tool for (§6.G.3; §10 SD48). */
export const TOOL_PROVIDERS = ['openai', 'anthropic', 'gemini'] as const;

/**
 * A provider the emitter serialises a tool for: `openai` for OpenAI strict function calling, `anthropic` for
 * Anthropic strict tool use, `gemini` for a Gemini function declaration's `parameters`.
 */
export type ToolProvider = (typeof TOOL_PROVIDERS)[number];

/** The literal type of a tool parameter. */
export type ToolValueType = 'string' | 'number' | 'boolean';

/**
 * The JSON Schema of one tool parameter. OpenAI types an optional parameter as `[T, "null"]` and adds `null` to its
 * enum; Gemini marks it `nullable`; Anthropic leaves it out of `required` only.
 */
export interface ToolProperty {
  readonly type: ToolValueType | readonly [ToolValueType, 'null'];
  readonly description?: string;
  readonly enum?: readonly (string | null)[];
  readonly nullable?: true;
}

/**
 * The `parameters` of a tool: a flat object of literal parameters, with no `$ref`, `oneOf`, `allOf`, recursion,
 * open map, common type or dynamic binding (ARCH §17.3). OpenAI and Anthropic close it with
 * `additionalProperties: false`; Gemini allows no `additionalProperties`. `required` is absent when it would be
 * empty, except for OpenAI, which lists every parameter.
 */
export interface ToolParameters {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, ToolProperty>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: false;
}

/** A frontend tool, `{name, description, parameters}` (ARCH §17.3; PRD Appendix D). */
export interface FrontendTool {
  /** The descriptor's catalog name, such as `Button`; it matches `^[a-zA-Z0-9_-]{1,64}$`. */
  readonly name: string;
  /** The descriptor's agent-facing description, at most 1024 characters. */
  readonly description: string;
  readonly parameters: ToolParameters;
}

/** One parameter of the flat literal model: the provider-neutral form the serialisers read. */
interface ModelParameter {
  readonly name: string;
  readonly type: ToolValueType;
  /** The values of an enum parameter. */
  readonly values?: readonly string[];
  readonly description?: string;
  readonly optional: boolean;
}

/** The flat literal model of one descriptor (§10 SD48). */
interface ToolModel {
  readonly name: string;
  readonly description: string;
  readonly parameters: readonly ModelParameter[];
}

/** A tool name all three providers accept (R3 §2.6; §10 SD49). */
const TOOL_NAME = /^[a-zA-Z0-9_-]{1,64}$/;

/** The self-imposed cap on a tool description, in characters (ARCH §17.3; R3 §2.6, §5 item 3). */
const MAX_DESCRIPTION_LENGTH = 1024;

/** The literal type each dynamic common type maps to, with the common type's schema (§6.G.3; R3 §6 Q4). */
const LITERAL_TYPES: Readonly<Record<string, { readonly schema: z.ZodTypeAny; readonly type: ToolValueType }>> = {
  DynamicString: { schema: DynamicStringSchema, type: 'string' },
  DynamicBoolean: { schema: DynamicBooleanSchema, type: 'boolean' },
  DynamicNumber: { schema: DynamicNumberSchema, type: 'number' },
};

/** The common types whose props carry tree structure or actions, which a tool leaves out (§10 SD47). */
const LEFT_OUT_TYPES: Readonly<Record<string, true>> = { ComponentId: true, ChildList: true, Action: true };

/**
 * The flat form of the A2UI `accessibility` object. The app applies the two parameters as the surface applies
 * `accessibility.label` and `.description` (§6.G.3; §6.G.4 Accessibility; §12 AM-069).
 */
const ACCESSIBILITY_PARAMETERS: readonly ModelParameter[] = [
  {
    name: 'accessibilityLabel',
    type: 'string',
    description: 'The accessible name that assistive technology announces; the tool form of `accessibility.label`.',
    optional: true,
  },
  {
    name: 'accessibilityDescription',
    type: 'string',
    description:
      'Extra detail that assistive technology announces after the name; the tool form of `accessibility.description`.',
    optional: true,
  },
];

/** The `REF:#/$defs/<Type>|<description>` marker that `commonProp` writes. */
const REF_MARKER = /^REF:#\/\$defs\/([A-Za-z]+)(?:\|([\s\S]*))?$/;

/**
 * Whether `schema` is a `z.optional` wrapper. The check reads the Zod 3 type name from the definition, so a
 * second Zod 3 copy, such as one nested under `@a2ui/web_core`, still matches.
 */
function isOptional(schema: z.ZodTypeAny): schema is z.ZodOptional<z.ZodTypeAny> {
  return schema._def.typeName === 'ZodOptional';
}

/** Whether `schema` is a `z.enum` of strings, by its Zod 3 type name as {@link isOptional} reads it. */
function isEnum(schema: z.ZodTypeAny): schema is z.ZodEnum<[string, ...string[]]> {
  return schema._def.typeName === 'ZodEnum';
}

/**
 * Whether the tool carries `accessibilityLabel` and `accessibilityDescription`: only when the surface sets
 * `accessibility` on the host of every tool-created node it could render, so never for Icon (`never`) or Stack
 * (`listRole`, a role a tool-created stack never takes) (§6.G.3; §12 AM-069).
 */
function takesAccessibility(hostNaming: HostNaming<string>): boolean {
  switch (hostNaming.kind) {
    case 'always':
    case 'unlessTrue':
      return true;
    case 'never':
    case 'listRole':
      return false;
  }
}

/**
 * The literal type of the dynamic common type `common`, whose `REF:` marker `schema` carries. It throws for any
 * other common type, and for a wrapper such as `.nullable()`, which copies the marker but not the common type's Zod
 * type and has no literal form.
 */
function literalType(where: string, common: string, schema: z.ZodTypeAny): ToolValueType {
  const literal = Object.hasOwn(LITERAL_TYPES, common) ? LITERAL_TYPES[common] : undefined;
  if (!literal) throw new Error(`[line-genui] ${where}: no literal tool type for the common type ${common}.`);
  if (schema._def.typeName !== literal.schema._def.typeName) {
    throw new Error(`[line-genui] ${where}: the tool walker takes ${common} only as it is or optional.`);
  }
  return literal.type;
}

/**
 * Reads one prop of a descriptor schema into a model parameter, or `undefined` for a prop the tool leaves out.
 * It throws on a schema it has no literal form for, so a new prop type fails the emitter instead of leaking.
 */
function modelParameter(component: string, name: string, prop: z.ZodTypeAny): ModelParameter | undefined {
  const optional = isOptional(prop);
  const inner = isOptional(prop) ? prop.unwrap() : prop;
  const where = `${component}.${name}`;
  const ref = REF_MARKER.exec(inner.description ?? '');
  if (ref) {
    const [, common = '', text] = ref;
    if (Object.hasOwn(LEFT_OUT_TYPES, common)) return undefined;
    return { name, type: literalType(where, common, inner), ...(text ? { description: text } : {}), optional };
  }
  if (isEnum(inner)) {
    const description = inner.description ? { description: inner.description } : {};
    return { name, type: 'string', values: inner.options, ...description, optional };
  }
  throw new Error(`[line-genui] ${where}: the tool walker takes a dynamic common type or a z.enum.`);
}

/**
 * Builds the flat literal model of a descriptor: its literal props, its dynamic props as literals, no
 * `ComponentId`, `ChildList` or `Action` prop, and `accessibility` flattened to two optional strings where the
 * descriptor takes them (§6.G.3; §10 SD47, SD48; §12 AM-069). It throws when the name or the description breaks a
 * provider-wide rule (§10 SD49).
 */
function toolModel(descriptor: LineDescriptor): ToolModel {
  const { name, description } = descriptor;
  if (!TOOL_NAME.test(name)) throw new Error(`[line-genui] Tool name "${name}" does not match ${TOOL_NAME.source}.`);
  const length = Array.from(description).length;
  if (length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`[line-genui] ${name}: the description has ${length} characters; tools allow 1024.`);
  }
  const parameters: ModelParameter[] = [];
  for (const [prop, schema] of Object.entries(descriptor.schema.shape)) {
    if (prop === 'accessibility') continue;
    const parameter = modelParameter(name, prop, schema);
    if (parameter) parameters.push(parameter);
  }
  if (takesAccessibility(descriptor.accessibility.hostNaming)) parameters.push(...ACCESSIBILITY_PARAMETERS);
  return { name, description, parameters };
}

/** Serialises one model parameter for `provider` (§6.G.3 provider table; R3 §2.6). */
function toolProperty(parameter: ModelParameter, provider: ToolProvider): ToolProperty {
  const { type, values, optional } = parameter;
  const description = parameter.description === undefined ? {} : { description: parameter.description };
  switch (provider) {
    case 'openai':
      return {
        type: optional ? [type, 'null'] : type,
        ...description,
        ...(values ? { enum: optional ? [...values, null] : [...values] } : {}),
      };
    case 'anthropic':
      return { type, ...description, ...(values ? { enum: [...values] } : {}) };
    case 'gemini':
      return {
        type,
        ...description,
        ...(values ? { enum: [...values] } : {}),
        ...(optional ? { nullable: true } : {}),
      };
  }
}

/** Serialises a model's parameters for `provider` (§6.G.3 provider table; §10 SD48). */
function toolParameters(parameters: readonly ModelParameter[], provider: ToolProvider): ToolParameters {
  const properties: Record<string, ToolProperty> = {};
  for (const parameter of parameters) properties[parameter.name] = toolProperty(parameter, provider);
  const required = parameters
    .filter((parameter) => provider === 'openai' || !parameter.optional)
    .map((parameter) => parameter.name);
  return {
    type: 'object',
    properties,
    ...(provider === 'openai' || required.length > 0 ? { required } : {}),
    ...(provider === 'gemini' ? {} : { additionalProperties: false as const }),
  };
}

/**
 * Returns the frontend tools of `descriptors` for `provider`: one `{name, description, parameters}` per descriptor
 * with `agentExposed: true`, in the order given, and none for a descriptor with `agentExposed: false`
 * (§6.G.3; ARCH §17.3; PRD Appendix D).
 *
 * Each tool's parameters are flat and literal. A dynamic prop takes its literal type (`DynamicString` →
 * `string`), an enum stays an enum, `ComponentId`, `ChildList` and `Action` props are left out, and the
 * `accessibility` object becomes the optional strings `accessibilityLabel` and `accessibilityDescription` where
 * the surface would set it on the host (§12 AM-069). `provider` picks the serialisation:
 *
 * - `openai`: every parameter in `required`, an optional one typed `[T, "null"]` (with `null` in its enum), and
 *   `additionalProperties: false`, for `strict: true`.
 * - `anthropic`: optional parameters left out of `required`, and `additionalProperties: false`, for `strict: true`.
 * - `gemini`: an OpenAPI 3.0.3 subset, with optional parameters `nullable` and no `additionalProperties`.
 *
 * @param descriptors The component descriptors, usually `descriptors`.
 * @param provider The provider the tools are for.
 * @returns Fresh tool objects that the caller may modify.
 * @throws When a tool name does not match `^[a-zA-Z0-9_-]{1,64}$`, a description exceeds 1024 characters, or a
 *   prop has no literal form.
 */
export function frontendTools(descriptors: readonly LineDescriptor[], provider: ToolProvider): FrontendTool[] {
  if (!TOOL_PROVIDERS.includes(provider)) {
    throw new TypeError(`[line-genui] Unknown tool provider "${provider}"; use ${TOOL_PROVIDERS.join(', ')}.`);
  }
  return descriptors
    .filter((descriptor) => descriptor.agentExposed)
    .map((descriptor) => {
      const model = toolModel(descriptor);
      return {
        name: model.name,
        description: model.description,
        parameters: toolParameters(model.parameters, provider),
      };
    });
}
