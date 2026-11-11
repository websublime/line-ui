// Loads the built `./avatar` subpath with its size tokens and without `line-themes`, so the colour tokens are invalid
// at computed-value time and the ring falls back to `Canvas` (spec 0009-avatar.md CSS custom properties, D8).
import '@websublime/line-components/avatar';
import '@websublime/line-tokens/radii';
import '@websublime/line-tokens/sizing';
import '@websublime/line-tokens/typography';
