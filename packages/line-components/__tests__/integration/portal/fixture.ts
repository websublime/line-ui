// Loads only the built `./portal` subpath by package name, as a consumer does (spec §7.8 rule 2; spec
// 0013-portal.md Tests, Browser row). Portal reads no token and no theme, so nothing else loads.
import '@websublime/line-components/portal';
