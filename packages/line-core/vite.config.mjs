import shared from '../../vite.config.shared.mjs';

// Phase 00: `index` smoke entry plus the `./machine` subpath (D6). The
// remaining subpath entries (./styles, ./mixins/*) land with D7 / D4 / D5.
export default shared({
  entries: {
    index: 'src/index.ts',
    'machine/index': 'src/machine/index.ts',
  },
});
