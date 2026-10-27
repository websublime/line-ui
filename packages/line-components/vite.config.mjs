import { mergeConfig } from 'vite';
import shared from '../../vite.config.shared.mjs';

// The root entry stays a zero-export module until P5 (Phase 1 spec §6.C.0 step 3). Each C row adds
// its own `'<c>/index'` entry (§4.2).
//
// Chunks that hold `src/shared/` modules land in `dist/shared/`, so the isolation scan can tell
// shared code by path (Phase 1 spec §6.P.9, §7.5). Every other chunk keeps Vite's library-mode name.
export default mergeConfig(
  shared({
    root: import.meta.dirname,
    entries: {
      index: 'src/index.ts',
      'button/index': 'src/button/index.ts',
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
