/**
 * The URL policy of `<line-a2ui-surface>` (Phase 1 spec §6.G.4 "URLs, text, theme"; ARCH §17.4; §10 SD57).
 *
 * @module a2ui/url-policy
 */

/** Where a URL is used: the source of an Image, Video or AudioPlayer, or the target of `openUrl`. */
export type UrlUse = 'image' | 'video' | 'audio' | 'openUrl';

/**
 * A consumer URL policy, the `urlPolicy` property. It runs after the default policy, with the URL resolved against
 * the document base, and `false` keeps the URL from the DOM and from `openUrl`. A throw counts as `false`.
 */
export type UrlPolicy = (url: URL, use: UrlUse) => boolean;

/**
 * The default allowlist, for media URLs and `openUrl` alike (§6.G.4; §12 AM-076). `data:` is never on it: that is
 * line policy, stricter than R5's default View CSP (§10 SD57).
 */
const SCHEMES: Readonly<Record<string, true>> = { 'https:': true, 'http:': true, 'mailto:': true, 'tel:': true };

/**
 * Resolves `raw` against `base` and returns the URL when the default policy and then `policy` allow it for `use`,
 * and `undefined` otherwise. Nothing it calls can throw out of it.
 *
 * @param raw The URL as the agent sent it.
 * @param use What the URL is for.
 * @param base The document base URL.
 * @param policy The consumer policy, if any.
 */
export function allowedUrl(raw: unknown, use: UrlUse, base: string, policy: UrlPolicy | undefined): URL | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return undefined;
  }
  if (!Object.hasOwn(SCHEMES, url.protocol)) return undefined;
  if (!policy) return url;
  try {
    return policy(new URL(url.href), use) === true ? url : undefined;
  } catch {
    return undefined;
  }
}
