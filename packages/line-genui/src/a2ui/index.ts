// The ./a2ui subpath: the A2UI session and <line-a2ui-surface> (Phase 1 spec §6.G.4). Preview until A2UI v1.0.
// Importing it defines `line-a2ui-surface` and nothing else; each component loads on first use (ARCH §17.4).
import { LineA2uiSurface } from './surface.js';

// biome-ignore lint/performance/noBarrelFile: the `./a2ui` subpath entry defines `line-a2ui-surface` and exposes the session, the element and their types (spec §6.G.4).
export {
  A2UI_VERSION,
  type A2uiActionMessage,
  type A2uiErrorBody,
  type A2uiErrorMessage,
  type SurfaceErrorCode,
} from './errors.js';
export { DEFAULT_LIMITS, type LimitName, type Limits } from './limits.js';
export type { MarkdownRenderer } from './projection.js';
export { Session, type SessionHost } from './session.js';
export { DEFAULT_LIVE_ERROR_TEXT, DEFAULT_LIVE_UPDATE_TEXT, LineA2uiSurface } from './surface.js';
export type { UrlPolicy, UrlUse } from './url-policy.js';

if (!customElements.get('line-a2ui-surface')) customElements.define('line-a2ui-surface', LineA2uiSurface);

declare global {
  interface HTMLElementTagNameMap {
    'line-a2ui-surface': LineA2uiSurface;
  }
}
