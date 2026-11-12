// Loads only the built `./visually-hidden` subpath; `late.html` imports this module when the test asks, so the page
// can be measured before `line-visually-hidden` is defined (spec 0012-visually-hidden.md F3).
import '@websublime/line-components/visually-hidden';
