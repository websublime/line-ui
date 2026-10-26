# @websublime/line-testing

Test helpers that more than one line://ui package uses. The package is private and is never published.

## Exports

- `@websublime/line-testing/htmx` — the htmx harness (`src/htmx.ts`). Its `expect…` functions take a Playwright
  `page` and a fixture description, and prove the four htmx behaviours of PRD Appendix A on htmx 2 and htmx 4.
  `routeHtmx` serves `htmx2/dist/htmx.js` or `htmx4/dist/htmx.js` from this package's own dependencies.

The export points at TypeScript source, which Playwright loads directly. The package has no build step.

## Who declares it

A package whose tests import a helper from here declares `"@websublime/line-testing": "workspace:^"` in its
`devDependencies` (PRD §5.2 rule 4). `line-core` declares it for the harness self-test in
`__tests__/integration/htmx/`. `line-components` declares it from the first component row whose tests import it.

The package holds no `@websublime/*` package in `dependencies` or `peerDependencies`. It declares `htmx2` and
`htmx4` in `dependencies` and `playwright` in `peerDependencies`, so the harness and the test that imports it share
one Playwright instance.
