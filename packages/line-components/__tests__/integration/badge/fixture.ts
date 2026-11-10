// Loads the built `./badge` subpath by package name, as a consumer does (spec §7.8 rule 2), with the tokens it reads
// and the theme (spec 0007-badge.md CSS custom properties). `INTERNALS` is re-exported so the browser tier reads the
// internals back (spec 0007-badge.md A11y, D13).
import '@websublime/line-components/badge';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';
import '@websublime/line-themes';

// biome-ignore lint/performance/noBarrelFile: the browser tier imports this page module to reach the INTERNALS copy the component uses (spec 0007-badge.md A11y).
export { INTERNALS } from '@websublime/line-core';
