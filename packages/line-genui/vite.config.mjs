import shared from '../../vite.config.shared.mjs';

// Phase 1 P1: the `./catalog` and `./a2ui` subpaths; no root entry (spec §4.1).
export default shared({
  root: import.meta.dirname,
  entries: {
    'catalog/index': 'src/catalog/index.ts',
    'a2ui/index': 'src/a2ui/index.ts',
  },
});
