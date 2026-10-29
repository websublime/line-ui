// Loads the built `./separator` subpath by package name, as a consumer does (spec §7.8 rule 2), with the
// thickness token and the theme. `INTERNALS` is re-exported so the browser tier reads the internals back.
import '@websublime/line-components/separator';
import '@websublime/line-components/stack';
import '@websublime/line-tokens/border-width';
import '@websublime/line-themes';

// biome-ignore lint/performance/noBarrelFile: the browser tier imports this page module to reach the INTERNALS copy the component uses (spec 0011-separator.md A11y).
export { INTERNALS } from '@websublime/line-core';
