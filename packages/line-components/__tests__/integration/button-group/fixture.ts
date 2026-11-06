// Loads the built `./button-group`, `./button`, `./icon-button` and `./separator` subpaths by package name, as a consumer does
// (spec §7.8 rule 2), with the radius and sizing tokens, so the corner checks read `--line-radius-2` (5px).
// `INTERNALS` is re-exported so the browser tier reads the internals back (spec 0004-button-group.md A11y).
import '@websublime/line-components/button-group';
import '@websublime/line-components/button';
import '@websublime/line-components/icon-button';
import '@websublime/line-components/separator';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';

// biome-ignore lint/performance/noBarrelFile: the browser tier imports this page module to reach the INTERNALS copy the component uses (spec 0004-button-group.md A11y).
export { INTERNALS } from '@websublime/line-core';
