/**
 * The frontend-tool emitter (Phase 1 spec §6.G.3 Acceptance; §10 SD46–SD50; §12 AM-069; ledger 01-G3).
 *
 * Every tool is checked per provider: Ajv compiles its parameters as JSON Schema 2020-12, the offline R3 P11 subset
 * checks of `tool-subsets.ts` find no violation, and its name and description meet the provider-wide rules. The
 * last test prints bytes and o200k tokens per tool and gates nothing (§10 SD50).
 *
 * @module __tests__/frontend-tools
 */

import { describe, expect, test } from 'bun:test';
import { Catalog } from '@a2ui/web_core/catalog';
import Ajv2020 from 'ajv/dist/2020.js';
import { encode } from 'gpt-tokenizer/encoding/o200k_base';
import { z } from 'zod';
import {
  buttonDescriptor,
  commonProp,
  type DescriptorInit,
  defineDescriptor,
  descriptors,
  type FrontendTool,
  frontendTools,
  iconDescriptor,
  type LineDescriptor,
  lineCatalogDocument,
  separatorDescriptor,
  stackDescriptor,
  TOOL_PROVIDERS,
  type ToolProvider,
} from '../src/catalog/index.js';
import { anthropicCapCounts, subsetViolations } from './tool-subsets.js';

type Json = Record<string, unknown>;

const toolsBy = Object.fromEntries(TOOL_PROVIDERS.map((provider) => [provider, frontendTools(descriptors, provider)]));

function tools(provider: ToolProvider): FrontendTool[] {
  return toolsBy[provider] ?? [];
}

function tool(provider: ToolProvider, name: string): FrontendTool {
  const found = tools(provider).find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no ${name} tool for ${provider}`);
  return found;
}

/** Ajv 2020 in strict mode; only OpenAI's `[T, "null"]` types need `allowUnionTypes` (R3 §2.5). */
function ajvFor(provider: ToolProvider): Ajv2020 {
  return new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: provider === 'openai' });
}

/** The init of a fixture descriptor with `props`. */
function fixture(props: z.ZodRawShape): DescriptorInit<z.ZodRawShape> {
  return {
    name: 'ToolFixture',
    tag: 'line-tool-fixture',
    load: async () => undefined,
    description: 'A fixture.',
    props,
    slots: {},
    bindings: { props: {} },
    actions: {},
    accessibility: { hostNaming: { kind: 'always' } },
  };
}

const ACCESSIBILITY = ['accessibilityLabel', 'accessibilityDescription'];

/**
 * The backticked names in `text` that `each` lacks as parameters: an `accessibility` member, or a prop of
 * `descriptor` the walker left out of the tool (its `ComponentId`, `ChildList` and `Action` props). Enum values and
 * event names name no prop, so they pass (§6.G.3 Contract; §12 AM-086).
 */
function lackedNames(text: string, descriptor: LineDescriptor, each: FrontendTool): string[] {
  const carried = new Set(Object.keys(each.parameters.properties));
  const leftOut = new Set(
    Object.keys(descriptor.schema.shape).filter((prop) => prop !== 'accessibility' && !carried.has(prop)),
  );
  const names = Array.from(text.matchAll(/`([^`]+)`/g), (match) => match[1] ?? '');
  return names.filter((name) => /^accessibility(\.|$)/.test(name) || leftOut.has(name));
}

function descriptorNamed(name: string): LineDescriptor {
  const found = descriptors.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no ${name} descriptor`);
  return found;
}

/** One case per provider and tool, as `[provider, tool name]`: acceptance holds per tool (§10 SD49). */
const CASES = TOOL_PROVIDERS.flatMap((provider) =>
  tools(provider).map((each): [ToolProvider, string] => [provider, each.name]),
);

describe('every tool, for every provider (§6.G.3 Acceptance; §10 SD46, SD49)', () => {
  test('one tool per agent-exposed descriptor, {name, description, parameters}', () => {
    for (const provider of TOOL_PROVIDERS) {
      expect(tools(provider).map((each) => each.name)).toEqual(['Button', 'Icon', 'Separator', 'Stack']);
      for (const each of tools(provider)) expect(Object.keys(each)).toEqual(['name', 'description', 'parameters']);
    }
  });

  test.each(CASES)('%s %s: parameters validate as JSON Schema 2020-12 under Ajv strict', (provider, name) => {
    const { parameters } = tool(provider, name);
    const ajv = ajvFor(provider);
    expect({ valid: ajv.validateSchema(parameters), errors: ajv.errors }).toEqual({ valid: true, errors: null });
    expect(() => ajv.compile(parameters)).not.toThrow();
  });

  test.each(CASES)('%s %s: parameters pass the offline R3 P11 subset checks', (provider, name) => {
    expect(subsetViolations({ ...tool(provider, name).parameters }, provider)).toEqual([]);
  });

  test('the subset checks reject what R3 P11 rejected: the toJson() Button with its common types', () => {
    const catalog = new Catalog('https://example.com/catalog.json', '0.9', [buttonDescriptor]).toJson();
    const components = catalog.components as Json;
    const button = components.Button as Json;
    for (const provider of TOOL_PROVIDERS) expect(subsetViolations(button, provider)).not.toEqual([]);
  });

  test.each(CASES)('%s %s: parameters are flat and literal, with no common type or binding', (provider, name) => {
    const { parameters } = tool(provider, name);
    const text = JSON.stringify(parameters);
    for (const banned of ['$ref', 'oneOf', 'allOf', 'anyOf', '$defs', 'REF:', 'DataBinding', 'FunctionCall']) {
      expect({ banned, found: text.includes(banned) }).toEqual({ banned, found: false });
    }
    for (const property of Object.values(parameters.properties)) {
      expect(Object.keys(property).filter((key) => !['type', 'description', 'enum', 'nullable'].includes(key))).toEqual(
        [],
      );
      const types = Array.isArray(property.type) ? property.type : [property.type];
      expect(types.filter((type) => !['string', 'number', 'boolean', 'null'].includes(type))).toEqual([]);
    }
  });

  test.each(CASES)(
    '%s %s: the name matches ^[a-zA-Z0-9_-]{1,64}$, the description is ≤ 1024 chars',
    (provider, name) => {
      const each = tool(provider, name);
      expect(each.name).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
      expect(Array.from(each.description).length).toBeLessThanOrEqual(1024);
    },
  );

  test('a description over 1024 characters or a name outside the pattern throws', () => {
    for (const provider of TOOL_PROVIDERS) {
      const long = defineDescriptor({ ...fixture({}), description: 'x'.repeat(1025) });
      expect(() => frontendTools([long], provider)).toThrow('1025 characters');
      const exact = defineDescriptor({ ...fixture({}), description: 'x'.repeat(1024) });
      expect(frontendTools([exact], provider)).toHaveLength(1);
      const dotted = defineDescriptor({ ...fixture({}), name: 'line.Button' });
      expect(() => frontendTools([dotted], provider)).toThrow('does not match');
    }
  });
});

describe('the flat literal model (§6.G.3 Contract; §10 SD47, SD48; §12 AM-069)', () => {
  test('each tool carries its literal props, without ComponentId, ChildList or Action props', () => {
    for (const provider of TOOL_PROVIDERS) {
      const names = (name: string) => Object.keys(tool(provider, name).parameters.properties);
      expect(names('Button')).toEqual(['variant', 'disabled', 'loading', 'pressed', ...ACCESSIBILITY]);
      expect(names('Icon')).toEqual(['name', 'mirror', 'path']);
      expect(names('Separator')).toEqual(['orientation', 'decorative', ...ACCESSIBILITY]);
      expect(names('Stack')).toEqual(['orientation', 'justify', 'align', 'gap', 'wrap']);
    }
  });

  test.each([...TOOL_PROVIDERS])(
    '%s: Button and Separator take the accessibility strings, Icon and Stack neither',
    (provider) => {
      const optionalString = provider === 'openai' ? ['string', 'null'] : 'string';
      for (const name of ['Button', 'Separator']) {
        const { properties, required } = tool(provider, name).parameters;
        expect(properties.accessibility).toBeUndefined();
        expect(ACCESSIBILITY.map((parameter) => properties[parameter]?.type)).toEqual([optionalString, optionalString]);
        if (provider !== 'openai')
          expect(ACCESSIBILITY.filter((parameter) => required?.includes(parameter))).toEqual([]);
      }
      for (const name of ['Icon', 'Stack']) {
        const { properties } = tool(provider, name).parameters;
        expect(['accessibility', ...ACCESSIBILITY].filter((parameter) => parameter in properties)).toEqual([]);
      }
    },
  );

  test('dynamic props take their literal type and keep their description without the REF: marker', () => {
    const { properties } = tool('anthropic', 'Button').parameters;
    expect(properties.disabled).toEqual({ type: 'boolean', description: 'Whether the action is unavailable.' });
    expect(tool('anthropic', 'Icon').parameters.properties.name).toEqual({
      type: 'string',
      description: "An A2UI icon name, such as `check` or `arrowBack`, looked up in the app's icon map.",
    });
    const number = defineDescriptor(fixture({ size: commonProp('DynamicNumber', 'A size.').optional() }));
    expect(frontendTools([number], 'anthropic')[0]?.parameters.properties.size).toEqual({
      type: 'number',
      description: 'A size.',
    });
  });

  test('an enum stays an enum, with its description', () => {
    expect(tool('anthropic', 'Stack').parameters.properties.gap).toEqual({
      type: 'string',
      description: 'The spacing between children, from `0` (none) to `5` (widest); unset gives a medium gap.',
      enum: ['0', '1', '2', '3', '4', '5'],
    });
  });

  test('a descriptor with agentExposed: false produces no tool', () => {
    const hidden = defineDescriptor({
      ...fixture({ tone: z.enum(['a', 'b']).describe('A tone.').optional() }),
      name: 'HiddenFixture',
      agentExposed: false,
      agentHiddenReason: 'It escapes the surface.',
    });
    for (const provider of TOOL_PROVIDERS) {
      expect(frontendTools([hidden], provider)).toEqual([]);
      expect(frontendTools([...descriptors, hidden], provider)).toEqual(tools(provider));
    }
  });

  test('a prop with no literal form throws instead of leaking into the tool', () => {
    const plain = defineDescriptor(fixture({ label: z.string().describe('A plain string.') }));
    expect(() => frontendTools([plain], 'openai')).toThrow('ToolFixture.label');
    const value = defineDescriptor(fixture({ value: commonProp('DynamicString', 'A value.').nullable() }));
    expect(() => frontendTools([value], 'openai')).toThrow('ToolFixture.value');
  });

  test.each(ACCESSIBILITY)(
    'a prop named %s throws, whether or not the tool takes the accessibility strings',
    (name) => {
      for (const kind of ['always', 'never'] as const) {
        const colliding = defineDescriptor({
          ...fixture({ [name]: commonProp('DynamicString', 'A name.').optional() }),
          accessibility: { hostNaming: { kind } },
        });
        for (const provider of TOOL_PROVIDERS) {
          expect(() => frontendTools([colliding], provider)).toThrow(`ToolFixture.${name}`);
        }
      }
    },
  );

  test.each([...TOOL_PROVIDERS])('%s: parameters.properties has a null prototype', (provider) => {
    for (const each of tools(provider)) expect(Object.getPrototypeOf(each.parameters.properties)).toBeNull();
    const plain = defineDescriptor(fixture({ tone: z.enum(['a', 'b']).describe('A tone.').optional() }));
    for (const each of frontendTools([plain], provider)) {
      expect(Object.getPrototypeOf(each.parameters.properties)).toBeNull();
      expect('toString' in each.parameters.properties).toBe(false);
    }
  });

  test('an unknown provider throws', () => {
    expect(() => frontendTools(descriptors, 'mistral' as ToolProvider)).toThrow('Unknown tool provider');
  });
});

describe('the tool description (§6.G.3; §12 AM-086)', () => {
  test('each tool takes the descriptor toolDescription when set, and its description otherwise', () => {
    for (const provider of TOOL_PROVIDERS) {
      for (const descriptor of descriptors) {
        expect(tool(provider, descriptor.name).description).toBe(descriptor.toolDescription ?? descriptor.description);
      }
    }
  });

  test('a descriptor without toolDescription emits its description; Icon sets none', () => {
    const plain = defineDescriptor(fixture({}));
    expect(Object.hasOwn(plain, 'toolDescription')).toBe(false);
    expect(Object.hasOwn(iconDescriptor, 'toolDescription')).toBe(false);
    for (const provider of TOOL_PROVIDERS) {
      expect(frontendTools([plain], provider)[0]?.description).toBe('A fixture.');
      expect(tool(provider, 'Icon').description).toBe(iconDescriptor.description);
    }
  });

  test('a descriptor with toolDescription emits it, under the 1024-character cap', () => {
    const override = defineDescriptor({ ...fixture({}), toolDescription: 'A fixture tool.' });
    expect(override.toolDescription).toBe('A fixture tool.');
    const long = defineDescriptor({ ...fixture({}), toolDescription: 'x'.repeat(1025) });
    const exact = defineDescriptor({ ...fixture({}), toolDescription: 'x'.repeat(1024) });
    const longDescription = defineDescriptor({
      ...fixture({}),
      description: 'x'.repeat(1025),
      toolDescription: 'A fixture tool.',
    });
    for (const provider of TOOL_PROVIDERS) {
      expect(frontendTools([override], provider)[0]?.description).toBe('A fixture tool.');
      expect(() => frontendTools([long], provider)).toThrow('1025 characters');
      expect(frontendTools([exact], provider)[0]?.description).toBe('x'.repeat(1024));
      expect(frontendTools([longDescription], provider)[0]?.description).toBe('A fixture tool.');
    }
  });

  test.each(['', ' ', ' \t\n\u00a0'])('toolDescription %p throws, with no fallback to description', (blank) => {
    const descriptor = defineDescriptor({ ...fixture({}), toolDescription: blank });
    for (const provider of TOOL_PROVIDERS) {
      expect(() => frontendTools([descriptor], provider)).toThrow('ToolFixture: toolDescription is empty');
    }
  });

  test('toolDescription stays out of the line catalog document', () => {
    const withTool = (descriptor: LineDescriptor): LineDescriptor =>
      descriptor.agentExposed ? { ...descriptor, toolDescription: `The ${descriptor.name} tool.` } : descriptor;
    const document = lineCatalogDocument(descriptors);
    const text = JSON.stringify(document);
    expect(text.includes('toolDescription')).toBe(false);
    for (const descriptor of descriptors) {
      if (descriptor.toolDescription) expect(text.includes(descriptor.toolDescription)).toBe(false);
    }
    const plain = defineDescriptor(fixture({}));
    expect(lineCatalogDocument([withTool(plain)])).toEqual(lineCatalogDocument([plain]));
    expect(lineCatalogDocument(descriptors.map(withTool))).toEqual(document);
  });

  test.each(CASES)('%s %s: the description names, in backticks, no parameter the tool lacks', (provider, name) => {
    const each = tool(provider, name);
    expect(lackedNames(each.description, descriptorNamed(name), each)).toEqual([]);
  });

  test('the guard fails on the agent-facing descriptions the three tool descriptions replace', () => {
    for (const provider of TOOL_PROVIDERS) {
      const lacked = (descriptor: LineDescriptor) =>
        lackedNames(descriptor.description, descriptor, tool(provider, descriptor.name));
      expect(lacked(buttonDescriptor)).toEqual(['child', 'accessibility.label']);
      expect(lacked(separatorDescriptor)).toEqual(['accessibility.label', 'accessibility.label']);
      expect(lacked(stackDescriptor)).toEqual(['children']);
    }
  });

  test('Button, Separator and Stack emit their toolDescription in place of their description', () => {
    for (const descriptor of [buttonDescriptor, separatorDescriptor, stackDescriptor]) {
      expect(descriptor.toolDescription).toBeString();
      expect(descriptor.toolDescription).not.toBe(descriptor.description);
      for (const provider of TOOL_PROVIDERS) {
        expect(tool(provider, descriptor.name).description).toBe(descriptor.toolDescription ?? '');
      }
    }
  });
});

describe('the provider serialisations (§6.G.3 provider table; §10 SD48)', () => {
  const required = defineDescriptor(
    fixture({
      tone: z.enum(['a', 'b']).describe('A tone.'),
      busy: commonProp('DynamicBoolean', 'Busy.'),
      hint: commonProp('DynamicString', 'A hint.').optional(),
    }),
  );

  test('OpenAI strict: every property required, optional ones [T, "null"], additionalProperties false', () => {
    const [parameters] = frontendTools([required], 'openai').map((each) => each.parameters);
    expect(parameters).toEqual({
      type: 'object',
      properties: {
        tone: { type: 'string', description: 'A tone.', enum: ['a', 'b'] },
        busy: { type: 'boolean', description: 'Busy.' },
        hint: { type: ['string', 'null'], description: 'A hint.' },
        ...accessibilityParameters(['string', 'null']),
      },
      required: ['tone', 'busy', 'hint', ...ACCESSIBILITY],
      additionalProperties: false,
    });
    expect(tool('openai', 'Button').parameters.properties.variant?.enum).toEqual([
      'default',
      'primary',
      'borderless',
      null,
    ]);
  });

  test('Anthropic strict: optional properties left out of required, additionalProperties false', () => {
    const [parameters] = frontendTools([required], 'anthropic').map((each) => each.parameters);
    expect(parameters).toEqual({
      type: 'object',
      properties: {
        tone: { type: 'string', description: 'A tone.', enum: ['a', 'b'] },
        busy: { type: 'boolean', description: 'Busy.' },
        hint: { type: 'string', description: 'A hint.' },
        ...accessibilityParameters('string'),
      },
      required: ['tone', 'busy'],
      additionalProperties: false,
    });
    expect(tool('anthropic', 'Button').parameters.required).toBeUndefined();
  });

  test('Gemini: optional properties nullable, no additionalProperties', () => {
    const [parameters] = frontendTools([required], 'gemini').map((each) => each.parameters);
    expect(parameters).toEqual({
      type: 'object',
      properties: {
        tone: { type: 'string', description: 'A tone.', enum: ['a', 'b'] },
        busy: { type: 'boolean', description: 'Busy.' },
        hint: { type: 'string', description: 'A hint.', nullable: true },
        ...accessibilityParameters('string', true),
      },
      required: ['tone', 'busy'],
    });
  });

  test('OpenAI: a call must give every parameter, null for an unset one, and only literals', () => {
    const validate = ajvFor('openai').compile(tool('openai', 'Button').parameters);
    const call = {
      variant: null,
      disabled: null,
      loading: null,
      pressed: true,
      accessibilityLabel: 'Bold',
      accessibilityDescription: null,
    };
    expect(validate(call)).toBe(true);
    expect(validate({ ...call, variant: 'primary' })).toBe(true);
    expect(validate({ ...call, accessibilityDescription: undefined })).toBe(false);
    expect(validate({ ...call, disabled: { path: '/busy' } })).toBe(false);
    expect(validate({ ...call, child: 'label' })).toBe(false);
  });

  test('Anthropic: a call may leave optional parameters out, and takes only literals', () => {
    const validate = ajvFor('anthropic').compile(tool('anthropic', 'Button').parameters);
    expect(validate({})).toBe(true);
    expect(validate({ variant: 'primary', accessibilityLabel: 'Save' })).toBe(true);
    expect(validate({ accessibility: { label: 'Save' } })).toBe(false);
    expect(validate({ action: { event: { name: 'save' } } })).toBe(false);
    expect(validate({ variant: 'loud' })).toBe(false);
  });

  test('Gemini: a call may leave optional parameters out or send null', () => {
    const validate = ajvFor('gemini').compile(tool('gemini', 'Separator').parameters);
    expect(validate({})).toBe(true);
    expect(validate({ orientation: 'vertical', decorative: null, accessibilityLabel: 'Details' })).toBe(true);
    expect(validate({ decorative: { path: '/plain' } })).toBe(false);
  });
});

function accessibilityParameters(type: unknown, nullable?: true): Json {
  const extra = nullable ? { nullable } : {};
  return {
    accessibilityLabel: {
      type,
      description: 'The accessible name that assistive technology announces; the tool form of `accessibility.label`.',
      ...extra,
    },
    accessibilityDescription: {
      type,
      description:
        'Extra detail that assistive technology announces after the name; the tool form of `accessibility.description`.',
      ...extra,
    },
  };
}

describe('tool weight (§10 SD50; R3 §2.7)', () => {
  test('prints bytes and o200k tokens per tool (report only)', () => {
    const rows = TOOL_PROVIDERS.flatMap((provider) =>
      tools(provider).map((each) => {
        const json = JSON.stringify(each);
        return { provider, tool: each.name, bytes: new TextEncoder().encode(json).length, o200k: encode(json).length };
      }),
    );
    const caps = tools('anthropic').reduce(
      (total, each) => {
        const counts = anthropicCapCounts({ ...each.parameters });
        return { optional: total.optional + counts.optional, union: total.union + counts.union };
      },
      { optional: 0, union: 0 },
    );
    console.info(
      [
        'Frontend tools, minified JSON of {name, description, parameters}:',
        '| Provider | Tool | Bytes | o200k tokens |',
        '|---|---|---|---|',
        ...rows.map((row) => `| ${row.provider} | ${row.tool} | ${row.bytes} | ${row.o200k} |`),
        `Anthropic strict, all ${tools('anthropic').length} tools in one request: ${caps.optional} optional parameters (cap 24), ${caps.union} union-typed (cap 16).`,
      ].join('\n'),
    );
    expect(rows).toHaveLength(TOOL_PROVIDERS.length * tools('openai').length);
  });
});
