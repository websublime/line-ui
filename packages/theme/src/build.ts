/**
 * Theme build script — auto-discovers CSS entry points and processes them
 * with PostCSS programmatic API in parallel.
 *
 * Replaces the previous approach of ~90 hardcoded css:* scripts in package.json,
 * each spawning a separate postcss-cli subprocess.
 *
 * Usage:
 *   bun run src/build.ts                    # Build all entries
 *   bun run src/build.ts --entry colors/amber  # Build a single entry
 *
 * @module build
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { Glob } from 'bun';
import postcss from 'postcss';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

/** Maximum number of files processed concurrently. */
const CONCURRENCY = 16;

// ---------------------------------------------------------------------------
// PostCSS plugin chain (mirrors postcss.config.mjs — keep both in sync)
// ---------------------------------------------------------------------------

async function createProcessor(): Promise<postcss.Processor> {
  const [
    { default: postcssImport },
    { default: postcssMixins },
    { default: postcssSimpleVars },
    { default: postcssNested },
    { default: postcssPresetEnv },
    { default: customMedia },
    { default: cssNano },
  ] = await Promise.all([
    import('postcss-import'),
    import('postcss-mixins'),
    import('postcss-simple-vars'),
    import('postcss-nested'),
    import('postcss-preset-env'),
    import('postcss-custom-media'),
    import('cssnano'),
  ]);

  return postcss([
    postcssImport(),
    postcssMixins(),
    postcssSimpleVars(),
    postcssNested(),
    (postcssPresetEnv as any)({
      autoprefixer: false,
      features: {
        'color-functional-notation': false,
        'custom-media-queries': { preserve: true },
        'custom-properties': false,
        'double-position-gradients': false,
        'focus-visible-pseudo-class': false,
        'focus-within-pseudo-class': false,
        'gap-properties': false,
        'logical-properties-and-values': false,
        'not-pseudo-class': false,
        'place-properties': false,
        'prefers-color-scheme-query': false,
      },
      stage: 0,
    }),
    customMedia(),
    (cssNano as any)({
      preset: 'default',
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Entry point discovery
// ---------------------------------------------------------------------------

interface EntryPoint {
  /** Absolute path to the source CSS file. */
  src: string;
  /** Output filename (e.g., "colors-amber.min.css"). */
  outFile: string;
}

/**
 * Files/patterns to EXCLUDE from entry discovery:
 * - mixins.css: contains only @define-mixin declarations, not standalone CSS
 * - style.css: dev/showcase file, not a distributable entry
 * - rules.css: consumed via @import by other files (legacy semantic defaults)
 * - tokens/ subdirectory: consumed via @import by tokens.css barrel
 */
const EXCLUDED_BASENAMES = new Set(['mixins.css', 'style.css', 'rules.css']);

/**
 * Compute the output filename for a given source path.
 *
 * Naming conventions (backward compatible with existing dist/):
 *   src/colors/{name}.css         -> colors-{name}.min.css
 *   src/schemas/{name}.css        -> schemas-{name}.min.css
 *   src/themes/{name}-theme.css   -> theme-{name}.min.css  (singular, strip '-theme')
 *   src/custom/{name}-custom.css  -> custom-{name}.min.css (strip '-custom')
 *   src/utils/{name}.css          -> utils-{name}.min.css
 *   src/tokens.css                -> tokens.min.css
 *   src/semantic-defaults.css     -> semantic-defaults.min.css
 *   src/aliases.css               -> aliases.min.css
 *   src/line.css                  -> line.min.css
 */
function computeOutFile(srcPath: string): string {
  const rel = relative(SRC, srcPath); // e.g. "colors/amber.css" or "tokens.css"
  const parts = rel.split('/');

  if (parts.length === 1) {
    // Root-level file: tokens.css -> tokens.min.css
    const name = basename(parts[0], '.css');
    return `${name}.min.css`;
  }

  const dir = parts[0];
  const file = basename(parts[1], '.css');

  switch (dir) {
    case 'colors':
      return `colors-${file}.min.css`;
    case 'schemas':
      return `schemas-${file}.min.css`;
    case 'themes': {
      // amber-theme.css -> theme-amber.min.css (singular prefix, strip '-theme')
      const name = file.replace(/-theme$/, '');
      return `theme-${name}.min.css`;
    }
    case 'custom': {
      // amber-custom.css -> custom-amber.min.css (strip '-custom')
      const name = file.replace(/-custom$/, '');
      return `custom-${name}.min.css`;
    }
    case 'utils':
      return `utils-${file}.min.css`;
    default:
      // Fallback: dir-file.min.css
      return `${dir}-${file}.min.css`;
  }
}

/**
 * Discover all CSS entry points from src/ using glob patterns.
 */
async function discoverEntries(): Promise<EntryPoint[]> {
  const entries: EntryPoint[] = [];

  // Directory-based entries
  const dirPatterns = [
    'colors/*.css',
    'schemas/*.css',
    'themes/*-theme.css',
    'custom/*-custom.css',
    'utils/*.css',
  ];

  for (const pattern of dirPatterns) {
    const glob = new Glob(pattern);
    for await (const match of glob.scan({ cwd: SRC, absolute: false })) {
      const base = basename(match);
      if (EXCLUDED_BASENAMES.has(base)) continue;
      const srcPath = join(SRC, match);
      entries.push({ src: srcPath, outFile: computeOutFile(srcPath) });
    }
  }

  // Root-level entry files (only if they exist)
  const rootEntries = [
    'tokens.css',
    'semantic-defaults.css',
    'aliases.css',
    'line.css',
  ];

  for (const file of rootEntries) {
    const srcPath = join(SRC, file);
    if (existsSync(srcPath)) {
      entries.push({ src: srcPath, outFile: computeOutFile(srcPath) });
    }
  }

  // Sort for deterministic output ordering
  entries.sort((a, b) => a.outFile.localeCompare(b.outFile));

  return entries;
}

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------

/**
 * Process a single CSS entry point through PostCSS.
 */
async function processEntry(
  processor: postcss.Processor,
  entry: EntryPoint,
): Promise<void> {
  const css = readFileSync(entry.src, 'utf-8');
  const result = await processor.process(css, {
    from: entry.src,
    to: join(DIST, entry.outFile),
  });

  const outPath = join(DIST, entry.outFile);
  const outDir = dirname(outPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  writeFileSync(outPath, result.css);

  // Log warnings
  for (const warning of result.warnings()) {
    console.warn(`  [warn] ${entry.outFile}: ${warning.text}`);
  }
}

/**
 * Run tasks with a concurrency limit.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startTime = performance.now();

  // Parse --entry flag
  const entryFlag = (() => {
    const idx = process.argv.indexOf('--entry');
    if (idx === -1 || idx + 1 >= process.argv.length) return null;
    return process.argv[idx + 1];
  })();

  // Ensure dist/ exists
  if (!existsSync(DIST)) {
    mkdirSync(DIST, { recursive: true });
  }

  // Create PostCSS processor (loaded once)
  const processor = await createProcessor();

  // Discover entries
  let entries = await discoverEntries();

  if (entryFlag) {
    // Filter to matching entry (e.g., --entry colors/amber)
    const normalized = entryFlag.replace(/\.css$/, '');
    entries = entries.filter((e) => {
      const rel = relative(SRC, e.src).replace(/\.css$/, '');
      return rel === normalized;
    });

    if (entries.length === 0) {
      console.error(`No entry found matching: ${entryFlag}`);
      console.error('Available entries can be listed by running without --entry');
      process.exit(1);
    }
  }

  console.info(`Processing ${entries.length} CSS entries...\n`);

  let failed = 0;
  const tasks = entries.map((entry) => async () => {
    try {
      await processEntry(processor, entry);
      console.info(`  ${entry.outFile} (${relative(SRC, entry.src)})`);
    } catch (err) {
      failed++;
      console.error(`  FAILED: ${entry.outFile}`);
      console.error(
        `    ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  await runWithConcurrency(tasks, CONCURRENCY);

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  console.info(
    `\n${entries.length - failed}/${entries.length} entries built in ${elapsed}s`,
  );

  if (failed > 0) {
    console.error(`${failed} entry(ies) failed.`);
    process.exit(1);
  }
}

main();
