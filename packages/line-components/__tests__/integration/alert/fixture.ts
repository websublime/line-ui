// Loads the built `./alert` subpath by package name, as a consumer does (spec §7.8 rule 2), with the tokens it reads
// and the theme, and `./icon-button` for the Dismiss recipe. `INTERNALS` is re-exported so the browser tier reads the
// internals back (spec 0006-alert.md A11y).
import '@websublime/line-components/alert';
import '@websublime/line-components/icon-button';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-themes';

// biome-ignore lint/performance/noBarrelFile: the browser tier imports this page module to reach the INTERNALS copy the component uses (spec 0006-alert.md A11y).
export { INTERNALS } from '@websublime/line-core';
