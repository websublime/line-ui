import shared from '../../vite.config.shared.mjs';

// Phase 00: dist/index.js must be a zero-export module (§4.7, §9.1).
// Source is `export {};` — no real components ship until Phase 1.
export default shared({
  entries: {
    index: 'src/index.ts',
  },
});
