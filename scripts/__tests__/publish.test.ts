/**
 * Snapshot guard unit tests (ledger 00-F3, spec §6.F.5 "Snapshot guard (AM-039)").
 *
 * `snapshotOffenders(rows, sha)` is the pure check `scripts/publish.mjs` runs with `--tag canary`
 * after the registry pass and before the first pack. No registry, no git: the rows and the sha are
 * literals.
 *
 * @module scripts/__tests__/publish
 */

import { describe, expect, test } from 'bun:test';
import { snapshotOffenders } from '../publish.mjs';

type Row = { name: string; version: string; action: 'publish' | 'skip' };

const HEAD = 'a049305f3c1d2e4b5a6978c0d1e2f3a4b5c6d7e8';
const OTHER = '0123456789abcdef0123456789abcdef01234567';

const row = (version: string, action: Row['action'] = 'publish', name = '@websublime/line-tokens'): Row => ({
  name,
  version,
  action,
});

const offenders = (rows: Row[]) => snapshotOffenders(rows, HEAD).map((r: Row) => `${r.name}@${r.version}`);

describe('snapshotOffenders', () => {
  test('a publish row at <x.y.z>-<HEAD sha>-SNAPSHOT passes', () => {
    expect(offenders([row(`0.1.0-${HEAD}-SNAPSHOT`), row(`10.20.30-${HEAD}-SNAPSHOT`)])).toEqual([]);
  });

  test('a plain 0.0.0 publish row fails', () => {
    expect(offenders([row('0.0.0')])).toEqual(['@websublime/line-tokens@0.0.0']);
  });

  test('a snapshot of a different sha fails', () => {
    expect(offenders([row(`0.1.0-${OTHER}-SNAPSHOT`)])).toEqual([`@websublime/line-tokens@0.1.0-${OTHER}-SNAPSHOT`]);
  });

  test.each([
    ['short sha', `0.1.0-${HEAD.slice(0, 7)}-SNAPSHOT`],
    ['missing -SNAPSHOT', `0.1.0-${HEAD}`],
    ['lowercase -snapshot', `0.1.0-${HEAD}-snapshot`],
    ['extra prerelease segment before the sha', `0.1.0-rc.1-${HEAD}-SNAPSHOT`],
    ['extra prerelease segment after -SNAPSHOT', `0.1.0-${HEAD}-SNAPSHOT.1`],
    ['build metadata', `0.1.0-${HEAD}-SNAPSHOT+build`],
    ['missing patch', `0.1-${HEAD}-SNAPSHOT`],
    ['leading zero', `0.01.0-${HEAD}-SNAPSHOT`],
    ['uppercase sha', `0.1.0-${HEAD.toUpperCase()}-SNAPSHOT`],
  ])('%s fails', (_label, version) => {
    expect(offenders([row(version)])).toEqual([`@websublime/line-tokens@${version}`]);
  });

  test('skip rows are never checked', () => {
    expect(offenders([row('0.0.0', 'skip'), row('1.2.3', 'skip'), row(`0.1.0-${OTHER}-SNAPSHOT`, 'skip')])).toEqual([]);
  });

  test('every offender is returned, in plan order, and passing or skipped rows are left out', () => {
    const rows: Row[] = [
      row('0.0.0', 'publish', '@websublime/line-colors'),
      row(`0.1.0-${HEAD}-SNAPSHOT`, 'publish', '@websublime/line-core'),
      row('0.0.0', 'skip', '@websublime/line-schemas'),
      row(`0.0.1-${OTHER}-SNAPSHOT`, 'publish', '@websublime/line-themes'),
      row('0.0.0', 'publish', '@websublime/line-components'),
    ];
    expect(offenders(rows)).toEqual([
      '@websublime/line-colors@0.0.0',
      `@websublime/line-themes@0.0.1-${OTHER}-SNAPSHOT`,
      '@websublime/line-components@0.0.0',
    ]);
  });
});
