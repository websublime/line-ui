import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Shared Vite library-mode config factory (§6.F.2).
// Consumed by `@websublime/line-core` and `@websublime/line-components`.
//
// Usage in a package's vite.config.mjs:
//   import shared from '../../vite.config.shared.mjs';
//   export default shared({ entries: { index: 'src/index.ts' } });
export default function shared(pkg) {
  return defineConfig({
    build: {
      target: 'es2022',
      lib: {
        entry: pkg.entries,
        formats: ['es'],
      },
      rollupOptions: {
        // Rolldown reads Rollup-shaped config
        external: [/^lit/, /^@zag-js\//],
      },
      sourcemap: true,
    },
    plugins: [dts({ outDir: 'dist', tsconfigPath: './tsconfig.json' })],
  });
}
