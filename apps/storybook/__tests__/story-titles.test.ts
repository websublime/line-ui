/**
 * Components story titles and ids (ledger 01-Z9; `docs/specs/COMPONENT-SPEC-TEMPLATE.md` "Tests").
 *
 * Every `stories/components/<file>.stories.ts` meta has `title: 'Components/<category>/<Name>'`, where
 * `<category>` is the `docs/PRD.md` §4.1–§4.10 heading whose table holds the component's row, and pins
 * `id: 'components-<file>'`, so story ids, visual baselines and URLs stay put when the sidebar tree changes.
 *
 * The meta is read from the source text, not imported: a stories module registers the built custom elements,
 * imports the shipped Custom Elements Manifest and Lit templates, and so needs a built workspace and a DOM,
 * while `title` and `id` are string literals that a static read sees exactly as Storybook's indexer does.
 *
 * @module apps/storybook/__tests__/story-titles
 */

import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const STORYBOOK_DIR = resolve(import.meta.dir, '..');
const STORIES_DIR = join(STORYBOOK_DIR, 'stories', 'components');
const PRD_PATH = resolve(STORYBOOK_DIR, '..', '..', 'docs', 'PRD.md');
const SUFFIX = '.stories.ts';

/** Case and every non-alphanumeric ignored, so `Icon Button` matches `IconButton`. */
const normalise = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Maps each normalised PRD §4.1–§4.10 component name to its section heading name. A first cell with
 * alternatives (`Kbd / Shortcut`) registers the whole cell and each alternative.
 */
function readCatalogue(): { categories: string[]; byName: Map<string, string[]> } {
  const prd = readFileSync(PRD_PATH, 'utf8');
  const start = prd.indexOf('\n## 4. Component Catalogue\n');
  const end = prd.indexOf('\n## 5. ', start);
  if (start < 0 || end < 0) throw new Error(`${PRD_PATH}: "## 4. Component Catalogue" section not found`);

  const categories: string[] = [];
  const byName = new Map<string, string[]>();
  for (const section of prd.slice(start, end).split('\n### ').slice(1)) {
    const heading = /^4\.(\d+) (.+)/.exec(section);
    if (!heading || Number(heading[1]) < 1 || Number(heading[1]) > 10) continue;
    const category = heading[2].trim();
    categories.push(category);
    // First cell of each table row, past the `| Component |` header and its `|---|` separator.
    const cells = [...section.matchAll(/^\|([^|]+)\|/gm)].map((row) => row[1].trim()).slice(2);
    for (const cell of cells) {
      for (const name of new Set([cell, ...cell.split('/')].map(normalise))) {
        byName.set(name, [...(byName.get(name) ?? []), category]);
      }
    }
  }
  return { categories, byName };
}

/** The `title` and `id` string literals of the `const meta = { … }` object at the top level of a stories file. */
function readMeta(source: string): { title?: string; id?: string } {
  const open = /^const meta = \{$/m.exec(source);
  if (!open) return {};
  const body = source.slice(open.index, source.indexOf('\n}', open.index));
  return {
    title: /^ {2}title: '([^']*)',$/m.exec(body)?.[1],
    id: /^ {2}id: '([^']*)',$/m.exec(body)?.[1],
  };
}

const { categories, byName } = readCatalogue();
const files = readdirSync(STORIES_DIR)
  .filter((name) => name.endsWith(SUFFIX))
  .sort();

describe('PRD §4 catalogue', () => {
  test('lists ten categories, §4.1 to §4.10', () => {
    expect(categories).toHaveLength(10);
  });
});

describe('components story meta', () => {
  test('there are components stories', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(files)('%s: title is Components/<PRD §4 category>/<Name>', (file) => {
    const where = `stories/components/${file}`;
    const { title } = readMeta(readFileSync(join(STORIES_DIR, file), 'utf8'));
    if (title === undefined) throw new Error(`${where}: no \`title: '…'\` in \`const meta = {…}\``);
    const segments = title.split('/');
    if (segments.length !== 3 || segments[0] !== 'Components') {
      throw new Error(`${where}: title '${title}' is not 'Components/<PRD §4 category>/<Name>'`);
    }
    const [, category, name] = segments;
    const found = byName.get(normalise(name));
    if (!found) throw new Error(`${where}: component '${name}' has no row in docs/PRD.md §4.1–§4.10`);
    if (found.length > 1) {
      throw new Error(`${where}: component '${name}' has rows in several PRD §4 categories: ${found.join(', ')}`);
    }
    if (category !== found[0]) {
      throw new Error(`${where}: title category '${category}' is not '${found[0]}', the PRD §4 section of '${name}'`);
    }
  });

  test.each(files)('%s: id is components-<file>', (file) => {
    const { id } = readMeta(readFileSync(join(STORIES_DIR, file), 'utf8'));
    const expected = `components-${file.slice(0, -SUFFIX.length)}`;
    if (id !== expected) {
      throw new Error(
        `stories/components/${file}: meta id is ${id === undefined ? 'missing' : `'${id}'`}; pin \`id: '${expected}'\` so story ids do not follow the title`,
      );
    }
  });
});
