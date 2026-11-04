// Shipped manifest for <line-a2ui-surface> (Phase 1 spec §6.G.4, §10 SD94).
// The surface extends HTMLElement, not LitElement, so no framework plugin is needed.
// Only ./a2ui is analysed; ./catalog ships no custom element.
export default {
  globs: ['src/a2ui/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.stories.ts', '**/*.d.ts', '**/__tests__/**', 'src/catalog/**'],
  outdir: '.',
  packagejson: false,
};
