import shared from '../../vite.config.shared.mjs';

// Phase 00: smoke build entry only. Subpath entries (./machine, ./styles,
// ./mixins/*) land with Stream D source delivery.
export default shared({
  entries: {
    index: 'src/index.ts',
  },
});
