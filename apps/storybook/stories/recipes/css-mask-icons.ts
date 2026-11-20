// The icon tokens and the hover rule of the CSS mask icons recipe (ledger 01-D4). The tokens point at the Lucide files
// self-hosted under public/icons/lucide/ (lucide-static 1.56.0, ISC, LICENSE beside them), so no story makes a
// third-party request, and `--icon-check` is embedded as a `data:` URI.

/** The Lucide files the recipe declares as `--icon-<name>` tokens. */
const ICON_FILES = ['circle-alert', 'plus', 'refresh-cw', 'settings', 'star', 'x', 'zoom-in', 'zoom-out'] as const;

/** Lucide `check`, embedded. A mask reads only the alpha channel, so the stroke colour does not matter. */
const CHECK_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg>";

/**
 * The `:root` block declaring every icon token; `href` maps a file name such as `plus.svg` to the URL the token
 * holds. A relative URL in a token resolves against the stylesheet that uses it, not the one that declares it.
 */
export function iconTokensCss(href: (file: string) => string): string {
  const files = ICON_FILES.map((name) => `  --icon-${name}: url("${href(`${name}.svg`)}");`);
  return `:root {\n  --icon-check: url("data:image/svg+xml,${CHECK_SVG}");\n${files.join('\n')}\n}`;
}

/** The tokens as the docs page shows them: root-relative URLs, the safe choice for an app served from its root. */
export const ICON_TOKENS_CSS = iconTokensCss((file) => `/icons/lucide/${file}`);

/**
 * The recipe's own rule: while a component host is hovered, a slotted `.icon` shows `--icon-hover` when it sets one.
 * It is the article's `--icon-hover` redirect, aimed at the slotted element instead of the button itself.
 */
export const HOVER_CSS = `:is(line-button, line-icon-button, line-chip):hover > .icon {
  --icon-start: var(--icon-hover, var(--icon));
}`;

/**
 * The empty keyframes that the `@nudeui/icons` WebKit 301609 workaround animates with. The repository's PostCSS chain
 * (`postcss.config.mjs`, which Vite applies to Storybook's CSS) runs cssnano, whose `discardEmpty` drops an empty
 * `@keyframes` rule; the workaround's `animation: webkit-301609 0s` then names no keyframes and runs nothing.
 */
export const WEBKIT_KEYFRAMES_CSS = '@keyframes webkit-301609 {}';

const STYLE_ID = 'css-mask-icons-recipe';

/**
 * Adds the tokens, the hover rule and the WebKit keyframes to the document once, in a `<style>` no build step
 * touches. Storybook previews deploy under a sub-path, so the stories resolve each file against the document base
 * and declare an absolute URL, which every stylesheet resolves the same way.
 */
export function installIconTokens(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  const tokens = iconTokensCss((file) => new URL(`./icons/lucide/${file}`, document.baseURI).href);
  style.textContent = `${tokens}\n${HOVER_CSS}\n${WEBKIT_KEYFRAMES_CSS}`;
  document.head.append(style);
}
