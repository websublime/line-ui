import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';

// Shared Vite library-mode config factory (Phase 00 spec §6.F.2, Phase 1 spec P8, P9).
// Every name in `dependencies` and `peerDependencies`, and every subpath of it, stays external.
// So do the package's own name and its subpaths: a self-reference stays a bare specifier in dist/
// (Phase 1 spec §6.C.2, §6.P.9; §12 AM-050).
export default function shared(pkg) {
  const manifest = JSON.parse(readFileSync(join(pkg.root, 'package.json'), 'utf8'));
  const names = [manifest.name, ...Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })];
  return defineConfig({
    build: {
      target: 'es2022',
      lib: { entry: pkg.entries, formats: ['es'] },
      rollupOptions: {
        external: (id) => names.some((name) => id === name || id.startsWith(`${name}/`)),
      },
      // Watch rebuilds keep dist/, so the `tsc --watch` declarations survive (§7.1; §12 AM-006, L2R3-04).
      emptyOutDir: !process.argv.includes('--watch'),
      sourcemap: true,
    },
  });
}
