# @websublime/line-site

Astro 7 site for the line://ui design system, served at <https://line-ui.websublime.com>. Private (never published).
The landing page builds from the line://ui components; each section loads its own through a `<script>` import, and `__tests__/landing.e2e.ts` guards that every `line-*` tag registers.

The site builds static HTML with no adapter (spec AM-046).

## Commands

```sh
bun --filter '@websublime/line-site' dev     # local dev server
bun --filter '@websublime/line-site' build   # static build to apps/site/dist
```

## Deploy

`.github/workflows/deploy-site.yml` deploys `dist/` to the Cloudflare Pages project `line-ui` on every push to `main`
that touches the site, using the `wrangler` locked in `bun.lock` (a devDependency of this app).
