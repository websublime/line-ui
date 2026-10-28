import { mergeConfig } from 'vite';
import shared from '../../vite.config.shared.mjs';

// Phase 00: dist/index.js must be a zero-export module (§4.7, §9.1).
// Source is `export {};` — no real components ship until Phase 1.
//
// Chunks that hold `src/shared/` modules land in `dist/shared/`, so the isolation scan can tell
// shared code by path (Phase 1 spec §6.P.9, §7.5). Every other chunk keeps Vite's library-mode name.
export default mergeConfig(
  shared({
    root: import.meta.dirname,
    entries: {
      index: 'src/index.ts',
      'button/index': 'src/button/index.ts',
      'stack/index': 'src/stack/index.ts',
    },
  }),
  {
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: (chunk) =>
            chunk.moduleIds.some((id) => id.includes('/src/shared/')) ? 'shared/[name].js' : '[name]-[hash].js',
        },
      },
    },
  },
);
