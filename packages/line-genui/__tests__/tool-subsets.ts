/**
 * The offline provider subset checks behind the frontend-tool tests (Phase 1 spec §6.G.3; §10 SD46, SD49; ledger
 * 01-G3), after the R3 P11 probe (`docs/research/01-research-descriptor-api.md` §2.6, §3).
 *
 * Each check walks a tool's `parameters` and returns its violations of one provider subset as R3 §2.6 records it;
 * an empty list passes. The checks count keyword and structure violations and call no provider.
 *
 * - OpenAI strict: the root is an object, not `anyOf`; every object has `additionalProperties: false` and lists
 *   every property in `required`; types are string, number, boolean, integer, object, array (and `null` in a
 *   `[T, "null"]` type); `$ref` is local; `allOf`, `not`, `dependentRequired`, `dependentSchemas` and
 *   `if`/`then`/`else` are unsupported; at most 5000 properties, 10 nesting levels, 1000 enum values, and 120,000
 *   characters of property names, enum values and consts.
 * - Anthropic strict: the root is an object; every object has `additionalProperties: false`; enums are primitive;
 *   `allOf` holds no `$ref`; `$ref` is local and not recursive; numeric constraints and `minLength`/`maxLength` are
 *   unsupported; `minItems` is 0 or 1.
 * - Gemini `parameters`: the OpenAPI 3.0.3 `Schema` subset, `type`, `format`, `title`, `description`, `nullable`,
 *   `enum`, `items`, `properties`, `required`, `anyOf`, `propertyOrdering`, `default`, `example` and the min/max
 *   keywords, so no `$ref`, `oneOf`, `allOf`, `const`, `additionalProperties` or `$schema`; one type name per
 *   schema, with no `null` type; string enums; a `required` with at least one name.
 *
 * @module __tests__/tool-subsets
 */

import type { ToolProvider } from '../src/catalog/index.js';

type Schema = Record<string, unknown>;

/** A subschema with its JSON pointer and its object nesting depth, the root at depth 1. */
interface Node {
  readonly schema: Schema;
  readonly pointer: string;
  readonly depth: number;
}

function isSchema(value: unknown): value is Schema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The direct subschemas of `schema`, each with its pointer suffix and whether it nests one object level deeper. */
function children(schema: Schema): [unknown, string, boolean][] {
  const named = (keyword: string, nests: boolean): [unknown, string, boolean][] => {
    const map = schema[keyword];
    return isSchema(map) ? Object.entries(map).map(([name, child]) => [child, `/${keyword}/${name}`, nests]) : [];
  };
  const listed = (keyword: string): [unknown, string, boolean][] => {
    const list = schema[keyword];
    return Array.isArray(list) ? list.map((child, index) => [child, `/${keyword}/${index}`, false]) : [];
  };
  return [
    ...named('properties', true),
    [schema.items, '/items', true],
    ...listed('anyOf'),
    ...listed('oneOf'),
    ...listed('allOf'),
    ...named('$defs', false),
    ...named('definitions', false),
  ];
}

/** Every subschema of `schema`, the root first. */
function subschemas(schema: Schema, pointer = '#', depth = 1): Node[] {
  return [
    { schema, pointer, depth },
    ...children(schema).flatMap(([child, suffix, nests]) =>
      isSchema(child) ? subschemas(child, pointer + suffix, nests ? depth + 1 : depth) : [],
    ),
  ];
}

function typeNames(schema: Schema): unknown[] {
  return Array.isArray(schema.type) ? schema.type : schema.type === undefined ? [] : [schema.type];
}

function isObjectSchema(schema: Schema): boolean {
  return typeNames(schema).includes('object') || isSchema(schema.properties);
}

function propertyNames(schema: Schema): string[] {
  return isSchema(schema.properties) ? Object.keys(schema.properties) : [];
}

function keywordViolations({ schema, pointer }: Node, allowed: ReadonlySet<string>): string[] {
  return Object.keys(schema)
    .filter((keyword) => !allowed.has(keyword))
    .map((keyword) => `${pointer}: keyword ${keyword} is outside the subset`);
}

function refViolations({ schema, pointer }: Node): string[] {
  const ref = schema.$ref;
  return ref === undefined || (typeof ref === 'string' && ref.startsWith('#'))
    ? []
    : [`${pointer}: $ref ${String(ref)} is not local`];
}

/** An object's closure: `additionalProperties: false`, and with `allRequired` every property in `required`. */
function closureViolations({ schema, pointer }: Node, allRequired: boolean): string[] {
  if (!isObjectSchema(schema)) return [];
  const closed = schema.additionalProperties === false ? [] : [`${pointer}: additionalProperties is not false`];
  const required = Array.isArray(schema.required) ? schema.required : [];
  const missing = allRequired ? propertyNames(schema).filter((name) => !required.includes(name)) : [];
  return [...closed, ...missing.map((name) => `${pointer}: ${name} is not required`)];
}

function rootViolations(parameters: Schema): string[] {
  return parameters.type === 'object' ? [] : ['#: the root is not an object'];
}

const OPENAI_KEYWORDS: ReadonlySet<string> = new Set([
  'type',
  'description',
  'title',
  'properties',
  'required',
  'additionalProperties',
  'enum',
  'const',
  'items',
  'anyOf',
  '$defs',
  '$ref',
]);
const OPENAI_TYPES: ReadonlySet<unknown> = new Set(['string', 'number', 'boolean', 'integer', 'object', 'array']);

function openaiTypeViolations({ schema, pointer }: Node): string[] {
  const types = typeNames(schema);
  const nonNull = types.filter((type) => type !== 'null');
  const union = Array.isArray(schema.type) && nonNull.length !== 1 ? [`${pointer}: type is not [T, "null"]`] : [];
  const unsupported = nonNull.filter((type) => !OPENAI_TYPES.has(type)).map((type) => `${pointer}: type ${type}`);
  const enumWithoutNull =
    types.includes('null') && Array.isArray(schema.enum) && !schema.enum.includes(null)
      ? [`${pointer}: a nullable enum without null rejects null`]
      : [];
  return [...union, ...unsupported, ...enumWithoutNull];
}

function openaiLimitViolations(nodes: readonly Node[]): string[] {
  const names = nodes.flatMap(({ schema }) => propertyNames(schema));
  const values = nodes.flatMap(({ schema }) => (Array.isArray(schema.enum) ? schema.enum : []));
  const consts = nodes.flatMap(({ schema }) => (schema.const === undefined ? [] : [schema.const]));
  const characters = [...names, ...values, ...consts].reduce<number>(
    (sum, value) => sum + (typeof value === 'string' ? value.length : 0),
    0,
  );
  return [
    ...(names.length > 5000 ? [`#: ${names.length} properties, over 5000`] : []),
    ...(values.length > 1000 ? [`#: ${values.length} enum values, over 1000`] : []),
    ...(characters > 120_000 ? [`#: ${characters} characters of names and values, over 120,000`] : []),
    ...nodes.filter((node) => node.depth > 10).map(({ pointer }) => `${pointer}: nesting deeper than 10 levels`),
  ];
}

function openaiViolations(parameters: Schema): string[] {
  const nodes = subschemas(parameters);
  return [
    ...rootViolations(parameters),
    ...('anyOf' in parameters ? ['#: the root is anyOf'] : []),
    ...nodes.flatMap((node) => [
      ...keywordViolations(node, OPENAI_KEYWORDS),
      ...refViolations(node),
      ...openaiTypeViolations(node),
      ...closureViolations(node, true),
    ]),
    ...openaiLimitViolations(nodes),
  ];
}

const ANTHROPIC_KEYWORDS: ReadonlySet<string> = new Set([
  'type',
  'description',
  'title',
  'properties',
  'required',
  'additionalProperties',
  'enum',
  'const',
  'anyOf',
  'allOf',
  '$ref',
  '$defs',
  'definitions',
  'default',
  'format',
  'items',
  'minItems',
]);

function anthropicNodeViolations({ schema, pointer }: Node): string[] {
  const ref = typeof schema.$ref === 'string' ? schema.$ref : undefined;
  const checks: [boolean, string][] = [
    [ref !== undefined && (ref === '#' || pointer.startsWith(`${ref}/`)), 'recursive $ref'],
    [
      Array.isArray(schema.enum) && schema.enum.some((value) => typeof value === 'object' && value !== null),
      'enum value is not primitive',
    ],
    [
      Array.isArray(schema.allOf) && schema.allOf.some((branch) => isSchema(branch) && '$ref' in branch),
      'allOf holds a $ref',
    ],
    [schema.minItems !== undefined && schema.minItems !== 0 && schema.minItems !== 1, 'minItems other than 0 or 1'],
  ];
  return checks.filter(([failed]) => failed).map(([, message]) => `${pointer}: ${message}`);
}

function anthropicViolations(parameters: Schema): string[] {
  return [
    ...rootViolations(parameters),
    ...subschemas(parameters).flatMap((node) => [
      ...keywordViolations(node, ANTHROPIC_KEYWORDS),
      ...refViolations(node),
      ...anthropicNodeViolations(node),
      ...closureViolations(node, false),
    ]),
  ];
}

const GEMINI_KEYWORDS: ReadonlySet<string> = new Set([
  'type',
  'format',
  'title',
  'description',
  'nullable',
  'enum',
  'items',
  'properties',
  'required',
  'anyOf',
  'propertyOrdering',
  'default',
  'example',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
  'minLength',
  'maxLength',
  'minProperties',
  'maxProperties',
]);
const GEMINI_TYPES: ReadonlySet<unknown> = new Set(['string', 'number', 'integer', 'boolean', 'array', 'object']);

function geminiNodeViolations({ schema, pointer }: Node): string[] {
  const checks: [boolean, string][] = [
    [schema.type !== undefined && !GEMINI_TYPES.has(schema.type), 'type is not one OpenAPI type name'],
    [
      Array.isArray(schema.enum) && !schema.enum.every((value) => typeof value === 'string'),
      'enum value is not a string',
    ],
    [schema.nullable !== undefined && typeof schema.nullable !== 'boolean', 'nullable is not a boolean'],
    [Array.isArray(schema.required) && schema.required.length === 0, 'required is empty'],
  ];
  return checks.filter(([failed]) => failed).map(([, message]) => `${pointer}: ${message}`);
}

function geminiViolations(parameters: Schema): string[] {
  return [
    ...rootViolations(parameters),
    ...subschemas(parameters).flatMap((node) => [
      ...keywordViolations(node, GEMINI_KEYWORDS),
      ...geminiNodeViolations(node),
    ]),
  ];
}

/** The violations of the `provider` subset in a tool's `parameters`; an empty list passes. */
export function subsetViolations(parameters: Schema, provider: ToolProvider): string[] {
  switch (provider) {
    case 'openai':
      return openaiViolations(parameters);
    case 'anthropic':
      return anthropicViolations(parameters);
    case 'gemini':
      return geminiViolations(parameters);
  }
}

/**
 * The parameters that count against Anthropic's per-request caps across all strict tools: optional parameters
 * (not in `required`) and union-typed ones (a type array or `anyOf`) (R3 §2.6).
 */
export function anthropicCapCounts(parameters: Schema): { optional: number; union: number } {
  const properties = isSchema(parameters.properties) ? Object.entries(parameters.properties) : [];
  const required = Array.isArray(parameters.required) ? parameters.required : [];
  return {
    optional: properties.filter(([name]) => !required.includes(name)).length,
    union: properties.filter(([, schema]) => isSchema(schema) && (Array.isArray(schema.type) || 'anyOf' in schema))
      .length,
  };
}
