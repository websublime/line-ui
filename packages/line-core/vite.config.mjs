import shared from '../../vite.config.shared.mjs';

// Phase 00: `index` smoke entry plus the `./machine` (D6) and `./styles` (D7)
// subpaths. The remaining `./mixins/*` entries land with D4 / D5.
export default shared({
  entries: {
    index: 'src/index.ts',
    'machine/index': 'src/machine/index.ts',
    'styles/index': 'src/styles/index.ts',
  },
});
