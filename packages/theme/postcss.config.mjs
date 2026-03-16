// PostCSS config for Vite dev server (auto-discovered by convention).
// Plugin chain is defined in src/postcss-pipeline.ts (single source of truth).
import { createPlugins } from './src/postcss-pipeline.ts';

export default {
  plugins: await createPlugins()
};
