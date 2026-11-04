---
"@websublime/line-genui": minor
---

`@websublime/line-genui/catalog` now emits frontend tools (`frontendTools(descriptors, provider)`): one flat, literal `{name, description, parameters}` per agent-exposed descriptor, serialised for OpenAI strict, Anthropic strict or Gemini, with `accessibilityLabel` and `accessibilityDescription` on the Button and Separator tools.
