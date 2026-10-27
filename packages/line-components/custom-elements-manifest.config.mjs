import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js';

// Shipped manifest (Phase 1 spec P10, D8). line-core sources are analysed so that
// inheritance from LineElement resolves by class name (R4 §2.3).
export default {
  globs: ['src/**/*.ts', '../line-core/src/**/*.ts'], // probed 2026-10-27: LineElement resolves at ../line-core/src/line-element.ts (§12 AM-053)
  // The analyser negates each pattern into a globby `!` pattern, and `**/` does not match a `../` prefix,
  // so the line-core glob needs its own exclusions (§12 AM-054).
  exclude: [
    '**/*.test.ts',
    '**/*.stories.ts',
    '**/*.d.ts',
    '../line-core/src/**/*.test.ts',
    '../line-core/src/**/*.stories.ts',
    '../line-core/src/**/*.d.ts',
  ],
  outdir: '.',
  packagejson: false,
  plugins: [...litPlugin()],
};
