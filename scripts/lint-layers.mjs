#!/usr/bin/env bun

/**
 * scripts/lint-layers.mjs — Layer-lint + prefix audit + colour-literal guard.
 *
 * Bun script (Node-compatible APIs only) invoked from CI per
 * docs/specs/00-spec-design-system.md §6.F.5 line 1330:
 *   - run: bun run scripts/lint-layers.mjs
 *
 * Three independent enforcers (all surfaced in a single run; non-zero exit if any fail):
 *
 *   1. DEPENDENCY GUARD (§6.B B3, lines 462-465):
 *      For each `packages/<pkg>/package.json` and `apps/<app>/package.json`, read
 *      `dependencies` + `peerDependencies` (NOT `devDependencies` — see DECISION
 *      in bead line-ui-7qm.2.3 comments). For every `@websublime/*` edge,
 *      verify the source package is in the allowed-edges table and that the
 *      target is in the source's allowed Set. Manifesto Law 10.
 *
 *   2. PREFIX AUDIT (§9.1 line 1644, Manifesto Law 2, PRD §9.14 T1):
 *      (a) Every published `name` field matches `^@websublime/line-[a-z][a-z0-9-]*$`.
 *      (b) Every `--*` CSS custom-property declaration emitted by
 *          line-tokens / line-colors / line-themes (src/ and dist/) is `--line-*` prefixed.
 *      (c) Every custom-element registration in test files
 *          (customElements.define / @customElement / createElement of a hyphenated
 *          tag) uses a `line-*` tag.
 *
 *   3. COLOUR-LITERAL GUARD (§7.5 line 1601 + §6.B line 569 + §10 D8 line 1776):
 *      packages/line-tokens/src/{gradients,highlights,svg}.css MUST NOT contain
 *      literal hex / rgb / hsl / color() values. Allowed reference form:
 *      `var(--line-{hue}-{step})`. Missing files are skipped (Stream C C2 owns them).
 *
 * Source of truth for the allowed-edges table:
 *   docs/specs/00-spec-design-system.md §6.B lines 449-460 (post-AM-004 alignment).
 *   Any spec amendment to those rows REQUIRES a matching edit to ALLOWED_EDGES
 *   below.
 */

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

/* --------------------------------------------------------------------------
 * Allowed edges (downward only). Verbatim from
 * docs/specs/00-spec-design-system.md §6.B lines 449-460 (post-AM-004).
 *
 *   line-tokens    : leaf
 *   line-colors    : leaf
 *   line-schemas   : leaf
 *   line-themes    : line-colors, line-schemas
 *   line-utils     : line-schemas
 *   line-core      : (no @websublime/* deps in Phase 00; lit + @zag-js/* are externals)
 *   line-components: line-core, line-tokens, line-themes, line-utils
 *   line-icons     : line-tokens
 * ------------------------------------------------------------------------*/
const ALLOWED_EDGES = Object.freeze({
  'line-tokens': new Set(),
  'line-colors': new Set(),
  'line-schemas': new Set(),
  'line-themes': new Set(['line-colors', 'line-schemas']),
  'line-utils': new Set(['line-schemas']),
  'line-core': new Set(),
  'line-components': new Set(['line-core', 'line-tokens', 'line-themes', 'line-utils']),
  'line-icons': new Set(['line-tokens']),
});

// Packages where CSS custom-property prefix audit applies (§9.1 line 1644 (a)).
const CSS_PREFIX_PACKAGES = ['line-tokens', 'line-colors', 'line-themes'];

// Files inside packages/line-tokens/src/ that must contain zero colour literals.
const COLOUR_LITERAL_FILES = ['gradients.css', 'highlights.css', 'svg.css'];

const PACKAGE_NAME_RE = /^@websublime\/line-[a-z][a-z0-9-]*$/;
const WEBSUBLIME_DEP_RE = /^@websublime\/(line-[a-z][a-z0-9-]*)$/;

/* --------------------------------------------------------------------------
 * Error accumulators (one bucket per enforcer for grouped output).
 * ------------------------------------------------------------------------*/
const errors = {
  dependency: [],
  prefix: [],
  colour: [],
};

const info = [];

const log = {
  err: (bucket, msg) => errors[bucket].push(msg),
  info: (msg) => info.push(msg),
};

/* --------------------------------------------------------------------------
 * Filesystem helpers (Node-portable; work under bun and node).
 * ------------------------------------------------------------------------*/

async function readJson(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function listWorkspaceDirs(globDir) {
  // `globDir` is a top-level workspace bucket (e.g. 'packages', 'apps') derived
  // from the root package.json `workspaces` field. Each child is a directory
  // containing a package.json.
  const root = join(REPO_ROOT, globDir);
  if (!existsSync(root)) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => join(root, e.name));
}

/**
 * Parse the root package.json `workspaces` field into the set of top-level
 * bucket directories the script must scan. Keeps the scan scope in sync with
 * the actual workspace declaration if new buckets are added.
 *
 * Supports both the array form (`["packages/*", "apps/*"]`) and the object
 * form (`{ packages: [...] }`). Only the leading path segment of each glob is
 * used as a bucket; deeper or non-`*` patterns fall back to their first
 * segment. Returns a de-duplicated, declaration-ordered list.
 */
async function workspaceBuckets() {
  const rootManifestPath = join(REPO_ROOT, 'package.json');
  if (!existsSync(rootManifestPath)) return [];
  const rootManifest = await readJson(rootManifestPath);
  const ws = rootManifest.workspaces;
  const patterns = Array.isArray(ws) ? ws : Array.isArray(ws?.packages) ? ws.packages : [];

  const buckets = [];
  const seen = new Set();
  for (const pattern of patterns) {
    if (typeof pattern !== 'string') continue;
    // First path segment, e.g. 'packages/*' -> 'packages', 'apps/foo' -> 'apps'.
    const bucket = pattern.split('/')[0].trim();
    if (!bucket || bucket === '.' || bucket === '*' || seen.has(bucket)) continue;
    seen.add(bucket);
    buckets.push(bucket);
  }
  return buckets;
}

async function walkFiles(dir, predicate) {
  // Recursively walk `dir` and return absolute paths matching `predicate(filename)`.
  if (!existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules / dist? dist is intentionally INCLUDED for prefix audit.
        if (entry.name === 'node_modules') continue;
        stack.push(full);
      } else if (entry.isFile() && predicate(entry.name, full)) {
        out.push(full);
      }
    }
  }
  return out;
}

/* --------------------------------------------------------------------------
 * Enforcer 1: Dependency guard.
 * ------------------------------------------------------------------------*/

function shortNameOf(pkgName) {
  // '@websublime/line-themes' -> 'line-themes'; anything else -> null.
  const m = pkgName.match(WEBSUBLIME_DEP_RE);
  return m ? m[1] : null;
}

function checkDependencyEdges(manifest, manifestPath) {
  const pkgName = manifest.name;
  const isApp = manifest.private === true;
  const short = shortNameOf(pkgName);
  const rel = relative(REPO_ROOT, manifestPath);

  // Apps (private:true) are not in ALLOWED_EDGES — their devDeps are out of
  // scope per spec §6.B B3 line 463 ("dependencies + peerDependencies").
  // Their `dependencies` + `peerDependencies` must still be empty of
  // @websublime/* OR explicitly handled below. apps/site has none; apps/storybook
  // declares @websublime/* only in devDependencies (allowed).
  const deps = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.peerDependencies ?? {}),
  };

  for (const depName of Object.keys(deps)) {
    const targetShort = shortNameOf(depName);
    if (!targetShort) continue; // external (lit, @zag-js/*, etc.) — not our concern.

    if (isApp) {
      // Apps must not have @websublime/* in dependencies/peerDependencies
      // (only devDependencies — out of scope here).
      log.err(
        'dependency',
        `${rel}: app '${pkgName}' declares forbidden runtime edge ` +
          `'${depName}' — apps may only reference @websublime/* in devDependencies (spec §3 line 88).`,
      );
      continue;
    }

    if (!short) {
      log.err(
        'dependency',
        `${rel}: package name '${pkgName}' is not a recognised @websublime/line-* package; ` +
          `cannot validate edge to '${depName}'.`,
      );
      continue;
    }

    if (!(short in ALLOWED_EDGES)) {
      log.err(
        'dependency',
        `${rel}: package '${short}' is not in the allowed-edges table ` +
          `(spec §6.B lines 449-460). Cannot declare edge to '${depName}'.`,
      );
      continue;
    }

    const allowed = ALLOWED_EDGES[short];
    if (!allowed.has(targetShort)) {
      const allowedList = [...allowed].sort().join(', ') || '(none — leaf)';
      log.err(
        'dependency',
        `${rel}: forbidden edge '${pkgName}' -> '${depName}'. ` + `'${short}' may depend on: ${allowedList}.`,
      );
    }
  }
}

/* --------------------------------------------------------------------------
 * Enforcer 2a: Package name audit.
 * ------------------------------------------------------------------------*/

function checkPackageName(manifest, manifestPath) {
  const isApp = manifest.private === true;
  const rel = relative(REPO_ROOT, manifestPath);
  // Apps are exempt per Manifesto Law 2 — they are not "public surface we author".
  if (isApp) return;
  if (!PACKAGE_NAME_RE.test(manifest.name ?? '')) {
    log.err(
      'prefix',
      `${rel}: published package name '${manifest.name}' does not match ` +
        `/^@websublime\\/line-[a-z][a-z0-9-]*$/ (Manifesto Law 2, PRD §9.14 T1).`,
    );
  }
}

/* --------------------------------------------------------------------------
 * Enforcer 2b: CSS custom-property prefix audit.
 *
 * Strip /* ... *\/ block comments, then match declarations of the form
 *   --<name>: <value>;
 * Require <name> to start with 'line-'.
 * ------------------------------------------------------------------------*/

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

const CSS_DECL_RE = /(?:^|[;{\s])(--[a-zA-Z_][\w-]*)\s*:/g;

async function auditCssCustomProperties(packageShort) {
  const pkgRoot = join(REPO_ROOT, 'packages', packageShort);
  const srcDir = join(pkgRoot, 'src');
  const distDir = join(pkgRoot, 'dist');
  const cssFiles = [
    ...(await walkFiles(srcDir, (n) => n.endsWith('.css'))),
    ...(await walkFiles(distDir, (n) => n.endsWith('.css'))),
  ];

  for (const file of cssFiles) {
    const raw = await readFile(file, 'utf8');
    const stripped = stripCssComments(raw);
    const seen = new Set();
    for (const match of stripped.matchAll(CSS_DECL_RE)) {
      const prop = match[1]; // includes leading '--'
      if (seen.has(prop)) continue;
      seen.add(prop);
      if (!prop.startsWith('--line-')) {
        const rel = relative(REPO_ROOT, file);
        log.err(
          'prefix',
          `${rel}: CSS custom property '${prop}' is not '--line-*' prefixed ` +
            `(Manifesto Law 2, spec §9.1 line 1644).`,
        );
      }
    }
  }
}

/* --------------------------------------------------------------------------
 * Enforcer 2c: Custom-element tag audit (in test files only).
 *
 * Patterns scanned (lit, vanilla, DOM):
 *   customElements.define('foo-bar', ...)
 *   @customElement('foo-bar')
 *   document.createElement('foo-bar')   // only hyphenated tags (custom elements)
 * A hyphen is required for a tag to be a custom element per the HTML spec, so we
 * only flag hyphenated literals.
 * ------------------------------------------------------------------------*/

const TAG_PATTERNS = [
  // customElements.define('tag', ...)
  /customElements\s*\.\s*define\s*\(\s*['"]([a-z][a-z0-9-]*)['"]/g,
  // @customElement('tag')
  /@customElement\s*\(\s*['"]([a-z][a-z0-9-]*)['"]\s*\)/g,
  // createElement('tag') — only hyphenated tags are custom elements
  /createElement\s*\(\s*['"]([a-z][a-z0-9]*-[a-z0-9-]*)['"]\s*[),]/g,
];

function isTestFile(name, path) {
  // Test conventions per spec §7.1: __tests__/ dirs, *.test.{ts,tsx,js,mjs},
  // and tests/ dirs (browser tier).
  if (!/\.(ts|tsx|js|mjs|cjs)$/.test(name)) return false;
  if (/\.test\.[a-z]+$/.test(name)) return true;
  if (path.includes(`${'/'}__tests__${'/'}`)) return true;
  if (path.includes(`${'/'}tests${'/'}`)) return true;
  return false;
}

function checkTagsInSource(source, fileRel) {
  for (const pattern of TAG_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const tag = match[1];
      if (!tag.includes('-')) continue; // not a custom element
      if (!tag.startsWith('line-')) {
        log.err(
          'prefix',
          `${fileRel}: custom-element tag '${tag}' is not 'line-*' prefixed ` +
            `(Manifesto Law 2, spec §9.1 line 1644).`,
        );
      }
    }
  }
}

async function auditCustomElementTags() {
  const roots = [join(REPO_ROOT, 'packages'), join(REPO_ROOT, 'apps')];
  for (const root of roots) {
    const files = await walkFiles(root, (n, p) => isTestFile(n, p));
    for (const file of files) {
      const raw = await readFile(file, 'utf8');
      checkTagsInSource(raw, relative(REPO_ROOT, file));
    }
  }
}

/* --------------------------------------------------------------------------
 * Enforcer 3: Colour-literal guard.
 *
 * Scope (spec §7.5 line 1601 + §6.B line 569):
 *   packages/line-tokens/src/gradients.css
 *   packages/line-tokens/src/highlights.css
 *   packages/line-tokens/src/svg.css
 *
 * Forbidden: literal hex (`#abc`, `#aabbcc`, `#aabbccdd`), `rgb(...)`, `rgba(...)`,
 * `hsl(...)`, `hsla(...)`, `color(...)`. Allowed: `var(--line-{hue}-{step})`.
 *
 * Missing files are non-blocking (Stream C C2 owns them).
 * ------------------------------------------------------------------------*/

// rgb()/hsl()/color() are function tokens that cannot appear in a CSS selector,
// so a plain regex is safe for them. Hex literals are handled separately by
// findHexLiterals() because a naive `#[0-9a-fA-F]{3,8}` regex would false-flag
// CSS selector ID fragments (`#myId { ... }`), and a delimiter-whitelisting
// regex (`[:(,]\s*#hex`) silently misses hex in space-separated multi-value
// declarations (`border: 1px solid #fff`, `box-shadow: 0 0 4px #000`).
const COLOUR_PATTERNS = [
  { name: 'rgb', re: /\brgba?\s*\(/g },
  { name: 'hsl', re: /\bhsla?\s*\(/g },
  { name: 'color()', re: /\bcolor\s*\(/g },
];

// Scan comment-stripped CSS and return the byte offsets of every hex literal
// that sits in a *declaration-value* position — i.e. inside a `{ ... }` block,
// after the property `:` and before the terminating `;`/`}`. This flags hex in
// shorthand/multi-value declarations (the colour-literal guard's primary target)
// while excluding two legitimate non-colour uses of `#`:
//   1. Selector ID fragments (`#myId`, `a#x:hover`) — these live at the selector
//      level (outside any declaration value), so they never enter value context.
//   2. `url(#ref)` SVG fragment references — skipped explicitly since they are
//      benign in-value uses of `#` that are not colour literals.
function findHexLiterals(css) {
  const hits = [];
  const n = css.length;
  const state = { depth: 0, inValue: false };
  let i = 0;
  while (i < n) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      // Skip string literals wholesale (e.g. content: "#fff").
      i = skipString(css, i);
      continue;
    }
    if (ch === '#') {
      const end = hexRunEnd(css, i);
      if (end > 0 && state.inValue && state.depth > 0 && !insideUrl(css, i)) {
        hits.push(i);
      }
      i = end > 0 ? end : i + 1;
      continue;
    }
    applyStructuralChar(ch, state);
    i++;
  }
  return hits;
}

// Advance past a quoted string starting at the opening quote `idx`; returns the
// offset just after the closing quote (handles backslash escapes).
function skipString(css, idx) {
  const quote = css[idx];
  let i = idx + 1;
  const n = css.length;
  while (i < n && css[i] !== quote) {
    if (css[i] === '\\') i++;
    i++;
  }
  return i + 1;
}

// Mutate the brace-depth / value-position tracker for one structural character.
function applyStructuralChar(ch, state) {
  if (ch === '{') {
    state.depth++;
    state.inValue = false;
  } else if (ch === '}') {
    if (state.depth > 0) state.depth--;
    state.inValue = false;
  } else if (ch === ';') {
    state.inValue = false;
  } else if (ch === ':' && state.depth > 0) {
    // Enter value position. Pseudo-class colons (`a:hover`) only matter at the
    // selector level (depth 0), which we ignore anyway.
    state.inValue = true;
  }
}

// If a `#` at offset `idx` begins a well-formed hex literal (3/4/6/8 hex digits
// terminated by a non-identifier char), return the offset just past the run;
// otherwise return -1.
function hexRunEnd(css, idx) {
  const n = css.length;
  let j = idx + 1;
  while (j < n && /[0-9a-fA-F]/.test(css[j])) j++;
  const len = j - idx - 1;
  const wellSized = len === 3 || len === 4 || len === 6 || len === 8;
  const wordBoundary = !(j < n && /[\w-]/.test(css[j]));
  return wellSized && wordBoundary ? j : -1;
}

// Return true if offset `idx` sits inside an unclosed `url(` on the same value,
// i.e. the nearest preceding unbalanced parenthesis run opens a `url(` token.
function insideUrl(css, idx) {
  let depthParen = 0;
  for (let k = idx - 1; k >= 0; k--) {
    const c = css[k];
    if (c === ')') depthParen++;
    else if (c === '(') {
      if (depthParen > 0) {
        depthParen--;
        continue;
      }
      // Unbalanced '(' — check the token immediately before it.
      const before = css.slice(Math.max(0, k - 4), k);
      return /\burl$/i.test(before);
    } else if (c === ';' || c === '{' || c === '}') {
      // Hit a value/block boundary before any open paren: not inside url().
      return false;
    }
  }
  return false;
}

async function auditColourLiterals() {
  const srcDir = join(REPO_ROOT, 'packages', 'line-tokens', 'src');
  for (const fname of COLOUR_LITERAL_FILES) {
    const path = join(srcDir, fname);
    if (!existsSync(path)) {
      log.info(
        `colour-literal: skipping packages/line-tokens/src/${fname} (file not yet authored; Stream C C2 scope).`,
      );
      continue;
    }
    const raw = await readFile(path, 'utf8');
    const stripped = stripCssComments(raw);
    const rel = relative(REPO_ROOT, path);

    // Collect (offset, kind) hits: hex literals via the context-aware scanner,
    // function tokens via plain regex. Report in source order for readability.
    const hits = [];
    for (const idx of findHexLiterals(stripped)) {
      hits.push({ idx, name: 'hex' });
    }
    for (const { name, re } of COLOUR_PATTERNS) {
      for (const match of stripped.matchAll(re)) {
        hits.push({ idx: match.index ?? 0, name });
      }
    }
    hits.sort((a, b) => a.idx - b.idx);

    for (const { idx, name } of hits) {
      // Compute 1-based line number from the stripped source (post-comment
      // removal). Offsets can shift versus the raw source but the line
      // number remains a useful pointer for the developer.
      const upTo = stripped.slice(0, idx);
      const line = upTo.split('\n').length;
      const snippet = stripped
        .slice(idx, idx + 32)
        .replace(/\s+/g, ' ')
        .trim();
      log.err(
        'colour',
        `${rel}:${line}: forbidden colour literal (${name}) — '${snippet}'. ` +
          `Decorative families must reference 'var(--line-{hue}-{step})' (spec §6.B line 569).`,
      );
    }
  }
}

/* --------------------------------------------------------------------------
 * Main entrypoint.
 * ------------------------------------------------------------------------*/

async function loadManifests() {
  const buckets = await workspaceBuckets();
  const dirs = [];
  for (const bucket of buckets) {
    dirs.push(...(await listWorkspaceDirs(bucket)));
  }
  const manifests = [];
  for (const dir of dirs) {
    const manifestPath = join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = await readJson(manifestPath);
    manifests.push({ manifest, path: manifestPath, dir });
  }
  return manifests;
}

function printGroup(label, lines) {
  if (lines.length === 0) return;
  console.error(`\n=== ${label} (${lines.length}) ===`);
  for (const line of lines) console.error(`  - ${line}`);
}

async function main() {
  const manifests = await loadManifests();

  // 1. Dependency guard + 2a. Package name audit (both walk the same manifests).
  for (const { manifest, path } of manifests) {
    checkDependencyEdges(manifest, path);
    checkPackageName(manifest, path);
  }

  // 2b. CSS custom-property prefix audit.
  for (const pkg of CSS_PREFIX_PACKAGES) {
    await auditCssCustomProperties(pkg);
  }

  // 2c. Custom-element tag audit.
  await auditCustomElementTags();

  // 3. Colour-literal guard.
  await auditColourLiterals();

  const total = errors.dependency.length + errors.prefix.length + errors.colour.length;

  if (info.length > 0) {
    console.error('\n=== info ===');
    for (const line of info) console.error(`  - ${line}`);
  }

  if (total === 0) {
    console.info('\nlint-layers: OK — dependency graph, prefix audit, and colour-literal guard all pass.');
    process.exit(0);
  }

  printGroup('dependency-guard violations', errors.dependency);
  printGroup('prefix-audit violations', errors.prefix);
  printGroup('colour-literal violations', errors.colour);
  console.error(
    `\nlint-layers: FAIL — ${total} violation(s) across ${
      [errors.dependency, errors.prefix, errors.colour].filter((b) => b.length > 0).length
    } categor${total === 1 ? 'y' : 'ies'}.`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error('lint-layers: unexpected error:', err);
  process.exit(2);
});
