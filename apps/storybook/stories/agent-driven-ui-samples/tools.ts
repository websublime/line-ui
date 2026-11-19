import { descriptors, type FrontendTool, frontendTools, type ToolParameters } from '@websublime/line-genui/catalog';

// One emitter, one provider argument: 'openai', 'anthropic' or 'gemini' (`TOOL_PROVIDERS`).

// OpenAI Responses API, strict function calling.
export const openaiTools = frontendTools(descriptors, 'openai').map((tool) => ({
  type: 'function' as const,
  ...tool,
  strict: true,
}));

// Gemini function calling. `parameters` is the OpenAPI 3.0.3 subset Gemini reads.
export const geminiTools = [{ functionDeclarations: frontendTools(descriptors, 'gemini') }];

// Anthropic Messages API, strict tool use. Anthropic caps one request across all its strict tools.
export const ANTHROPIC_STRICT_CAPS = { tools: 20, optionalParameters: 24, unionParameters: 16 } as const;

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: ToolParameters;
  strict: true;
}

/** The Anthropic strict tools of the named components. Throws when they alone break a per-request cap. */
export function anthropicTools(names: readonly string[]): AnthropicTool[] {
  const wanted = new Set(names);
  const tools: FrontendTool[] = frontendTools(
    descriptors.filter((descriptor) => wanted.has(descriptor.name)),
    'anthropic',
  );

  let optional = 0;
  let unions = 0;
  for (const { parameters } of tools) {
    const required = new Set(parameters.required ?? []);
    for (const [parameter, property] of Object.entries(parameters.properties)) {
      if (!required.has(parameter)) optional++;
      if (Array.isArray(property.type)) unions++;
    }
  }

  const caps = ANTHROPIC_STRICT_CAPS;
  if (tools.length > caps.tools || optional > caps.optionalParameters || unions > caps.unionParameters) {
    throw new RangeError(`${tools.length} strict tools, ${optional} optional and ${unions} union-typed parameters.`);
  }
  return tools.map(({ name, description, parameters }) => ({
    name,
    description,
    input_schema: parameters,
    strict: true,
  }));
}

// Button 6, Stack 5, Separator 4 and Icon 3 optional parameters make 18 of the 24.
export const pickedTools = anthropicTools(['Button', 'Stack', 'Separator', 'Icon']);
