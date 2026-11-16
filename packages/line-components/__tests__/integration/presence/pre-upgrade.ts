// Loads only the built `./presence` subpath; `pre-upgrade.html` imports this module when the test asks, so the page
// can be read before `line-presence` is defined (spec 0017-presence.md P6, D10).
import '@websublime/line-components/presence';
