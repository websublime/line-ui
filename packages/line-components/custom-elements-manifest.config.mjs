import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';

// Shipped manifest (Phase 1 spec P10, D8). line-core sources are analysed so that
// inheritance from LineElement resolves by class name (R4 §2.3).
export default {
  globs: ['src/**/*.ts', '../line-core/src/**/*.ts'], // probed 2026-10-27: LineElement resolves at ../line-core/src/line-element.ts (§12 AM-053)
  exclude: ['**/*.test.ts', '**/*.stories.ts', '**/*.d.ts'],
  outdir: '.',
  packagejson: false,
  plugins: [...litPlugin()],
};
