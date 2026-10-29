// The reference resolvers fetch one SVG file per icon from a folder the consumer serves or points at.

/** The folder that serves the icon files, such as a CDN URL pinned to the peer version or a self-hosted path. */
export type IconBase = string | URL;

/**
 * Fetches `file` relative to `base` and returns the response text. A path-only `base` resolves against
 * `document.baseURI`. A missing or invalid `base`, a network, CORS or CSP failure, and a non-ok response all
 * reject with a `[line-icons]` error, so the caller decides what a miss renders.
 */
export async function fetchIcon(file: string, base: IconBase | undefined): Promise<string> {
  if (!base) {
    throw new Error('[line-icons] The resolver needs a `base` URL for the folder that serves the icon files.');
  }
  let url: URL;
  try {
    url = new URL(file, new URL(base, globalThis.document?.baseURI));
  } catch (cause) {
    throw new Error(`[line-icons] Invalid base URL "${base}".`, { cause });
  }
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    // A network error, a CORS block or a CSP block; a cross-origin 404 without CORS headers also lands here.
    throw new Error(`[line-icons] Could not fetch "${url.href}".`, { cause });
  }
  if (!response.ok) throw new Error(`[line-icons] "${url.href}" responded with HTTP ${response.status}.`);
  try {
    return await response.text();
  } catch (cause) {
    throw new Error(`[line-icons] Could not read "${url.href}".`, { cause });
  }
}
