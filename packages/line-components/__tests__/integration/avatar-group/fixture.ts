// Loads the built `./avatar-group`, `./avatar` and `./badge` subpaths by package name, as a consumer does (Phase 1
// spec §7.8 rule 2), with the token families the group and the avatars read and the theme (spec 0010-avatar-group.md
// Tests). `INTERNALS` is re-exported so the browser tier reads the internals back (spec 0010-avatar-group.md A11y).
import '@websublime/line-components/avatar-group';
import '@websublime/line-components/avatar';
import '@websublime/line-components/badge';
import '@websublime/line-tokens/border-width';
import '@websublime/line-tokens/focus-ring';
import '@websublime/line-tokens/motion';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/shadows';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';
import '@websublime/line-themes';

// biome-ignore lint/performance/noBarrelFile: the browser tier imports this page module to reach the INTERNALS copy the component uses (spec 0010-avatar-group.md A11y).
export { INTERNALS } from '@websublime/line-core';
