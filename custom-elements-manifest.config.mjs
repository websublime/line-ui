// Custom Elements Manifest analyser config — repo root, single unified manifest.
//
// Root-only by design (spec § 6.F.1, § 7.3, Q3): one config globs every
// package source tree rather than running a per-package analyser. Phase 00
// ships no components, so the emitted manifest is empty — that is correct and
// expected; the wiring is verified by the manifest file being written.
//
// The manifest is written next to the Storybook app so the
// @storybook/web-components-vite builder can consume it as customElements.json
// at the Storybook project root.

import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';

export default {
  globs: ['packages/*/src/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.stories.ts', '**/*.d.ts'],
  outdir: 'apps/storybook',
  // Do not mutate the root package.json with a `customElements` field — the
  // manifest is a generated artifact consumed only by the Storybook app.
  packagejson: false,
  // Lit-aware analysis: resolves @customElement / reactive properties.
  plugins: [...litPlugin()],
};
