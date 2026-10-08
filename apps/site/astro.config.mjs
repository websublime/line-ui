import { defineConfig } from 'astro/config';

// Static output, no adapter (spec AM-046): `astro build` writes plain HTML to dist/,
// which deploy-site.yml uploads to Cloudflare Pages with the locked wrangler.
export default defineConfig({
  site: 'https://line-ui.websublime.com',
  output: 'static',
});
