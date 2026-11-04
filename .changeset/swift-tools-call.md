---
"@websublime/line-genui": minor
---

`@websublime/line-genui/catalog` now emits frontend tools (`frontendTools(descriptors, provider)`): one flat, literal `{name, description, parameters}` per agent-exposed descriptor, serialised for OpenAI strict, Anthropic strict or Gemini, with `accessibilityLabel` and `accessibilityDescription` on the Button and Separator tools. Descriptors gain an optional `toolDescription`, which the tool takes as its `description` in place of the agent-facing description; Button, Separator and Stack set one, and the `line` catalog is unchanged.
