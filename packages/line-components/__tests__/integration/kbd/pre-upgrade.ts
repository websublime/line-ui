// Loads only the built `./kbd` subpath; `pre-upgrade.html` imports this module when the test asks, so the page can be
// measured before `line-kbd` is defined (spec 0015-kbd.md P7, D20).
import '@websublime/line-components/kbd';
