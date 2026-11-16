// Loads only the built `./presence` subpath by package name, as a consumer does (spec §7.8 rule 2; spec
// 0017-presence.md Tests, Browser row). Presence reads no token and no theme, so nothing else loads; the page's own
// keyframes live in `index.html`.
import '@websublime/line-components/presence';
