// The CSS packages export only `.css` targets, so these side-effect imports resolve to no
// declarations and TypeScript 7.x reports TS2882 under `noUncheckedSideEffectImports`.
// Ambient declarations cover exactly these seven specifiers; the check stays on for every
// other import (01-P8; R11 §2.7 RC1, §6 OQ2 (b)).
declare module '@websublime/line-colors';
declare module '@websublime/line-themes';
declare module '@websublime/line-tokens/border-width';
declare module '@websublime/line-tokens/focus-ring';
declare module '@websublime/line-tokens/radii';
declare module '@websublime/line-tokens/sizing';
declare module '@websublime/line-tokens/typography';
