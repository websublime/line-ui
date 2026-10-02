import shared from '../../vite.config.shared.mjs';

// Phase 00: the `index` entry, the `./machine` (D6) and `./styles` (D7)
// subpaths, and one entry per `./mixins/*` subpath (D2–D5).
export default shared({
  entries: {
    index: 'src/index.ts',
    'machine/index': 'src/machine/index.ts',
    'styles/index': 'src/styles/index.ts',
    'mixins/direction': 'src/mixins/direction.ts',
    'mixins/inspector': 'src/mixins/inspector.ts',
    'mixins/metadata': 'src/mixins/metadata.ts',
    'mixins/form-associated': 'src/mixins/form-associated.ts',
  },
});
