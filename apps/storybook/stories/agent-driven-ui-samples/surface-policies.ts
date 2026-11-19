import type { LineA2uiSurface, MarkdownRenderer, UrlPolicy } from '@websublime/line-genui/a2ui';

// Runs after the default allowlist (`https:`, `http:`, `mailto:`, `tel:`) on the URL resolved against the
// document base. It can only reject: `false` or a throw keeps the URL out of the DOM and out of `openUrl`.
export const urlPolicy: UrlPolicy = (url, use) => {
  if (use === 'openUrl') return url.protocol === 'mailto:' || url.origin === location.origin;
  return url.protocol === 'https:' && url.hostname === 'media.example.com';
};

// The surface puts the returned node inside the Text element (`<p>`, `<h1>`–`<h5>`, `<small>`, or `<span>` in a
// Button), so it returns phrasing content. This renderer builds nodes from text and never parses HTML, so agent
// text cannot inject markup. A renderer that parses HTML must sanitise it first.
export const markdownRenderer: MarkdownRenderer = (markdown) => {
  const fragment = document.createDocumentFragment();
  // `split` with a capture group puts the bold runs at the odd indexes.
  for (const [index, run] of markdown.split(/\*\*(.+?)\*\*/s).entries()) {
    if (index % 2 === 0) fragment.append(run);
    else fragment.append(Object.assign(document.createElement('strong'), { textContent: run }));
  }
  return fragment;
};

export function applyPolicies(surface: LineA2uiSurface): void {
  surface.urlPolicy = urlPolicy;
  surface.markdownRenderer = markdownRenderer;
}
