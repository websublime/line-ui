// Loads only the built `./portal` subpath; `pre-upgrade.html` imports this module when the test asks, so the page
// can be measured before `line-portal` is defined (spec 0013-portal.md P6, D8).
import '@websublime/line-components/portal';
