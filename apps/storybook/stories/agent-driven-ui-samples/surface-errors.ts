import type { A2uiErrorMessage, LineA2uiSurface, SurfaceErrorCode } from '@websublime/line-genui/a2ui';

// The codes the surface raises itself. Any other code comes from `@a2ui/web_core`, such as `VALIDATION_ERROR`.
const SURFACE_CODES: Readonly<Record<SurfaceErrorCode, string>> = {
  LIMIT_EXCEEDED: 'A message would breach max-nodes, max-depth or max-data-model-size, so it was rejected.',
  MARKDOWN_RENDER_ERROR: 'markdownRenderer threw or returned no Node; the Text rendered as plain text.',
  MISSING_ACCESSIBLE_NAME: 'A component that needs an accessible name has none; it rendered as a placeholder.',
  UNMAPPED_ICON: 'An Icon name is not in iconMap, or iconMap is unset; the icon stays empty.',
  COMPONENT_LOAD_ERROR: "A descriptor's load() rejected, so its component never defined.",
  UNSUPPORTED_MESSAGE: 'A batch element is not an A2UI v0.9 envelope; it never reached web_core.',
};

export function isSurfaceCode(code: string): code is SurfaceErrorCode {
  return Object.hasOwn(SURFACE_CODES, code);
}

/** Sends every error to the agent, and tells the host about each error the surface raised itself. */
export function watchErrors(
  surface: LineA2uiSurface,
  send: (message: A2uiErrorMessage) => void,
  notice: (text: string) => void,
): void {
  surface.addEventListener('line-a2ui-error', (event) => {
    if (!(event instanceof CustomEvent)) return;
    const message: A2uiErrorMessage = event.detail;
    // `{ version: 'v0.9.1', error: { code, surfaceId, message, … } }`, the generic A2UI error form.
    const { code, surfaceId } = message.error;
    if (isSurfaceCode(code)) notice(`[${surfaceId}] ${code}: ${SURFACE_CODES[code]}`);
    send(message);
  });
}
