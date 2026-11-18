// Loads the built `./spinner` subpath by package name, as a consumer does (spec §7.8 rule 2), with `./button` and
// `./icon-button` for the loading-slot cases and the `motion`, `easings` and `sizing` tokens the spinner reads.
// `INTERNALS` is re-exported so the browser tier reads the internals back (spec 0022-spinner.md Tests, D18).
import '@websublime/line-components/spinner';
import '@websublime/line-components/button';
import '@websublime/line-components/icon-button';
import '@websublime/line-tokens/motion';
import '@websublime/line-tokens/easings';
import '@websublime/line-tokens/sizing';

// biome-ignore lint/performance/noBarrelFile: the browser tier imports this page module to reach the INTERNALS copy the component uses (spec 0022-spinner.md D18).
export { INTERNALS } from '@websublime/line-core';
