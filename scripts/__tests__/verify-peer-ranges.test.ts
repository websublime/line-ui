/**
 * SD76 check tests (ledger 01-Z14, Phase 1 spec §7.2, §10 SD76, §12 AM-121).
 *
 * `checkPeerRanges(releases, peerDependencies)` is the pure decision `scripts/verify-peer-ranges.mjs` runs over
 * the `changeset status --output` plan and `line-genui`'s peers; `verifyPeerRanges` adds the early pass and takes
 * the `changeset status` runner as a parameter. No git, no Changesets: every fact is a literal or a temp dir.
 *
 * @module scripts/__tests__/verify-peer-ranges
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPeerRanges, GENUI, pendingChangesets, verifyPeerRanges } from '../verify-peer-ranges.mjs';

const COMPONENTS = '@websublime/line-components';
const ICONS = '@websublime/line-icons';
const UNION = 'workspace:^0.1.0 || ^0.2.0';
const PEERS = { [COMPONENTS]: UNION, [ICONS]: UNION };

type Release = { name: string; type: string; oldVersion: string; newVersion: string; changesets: string[] };

function release(name: string, type: string, oldVersion: string, newVersion: string): Release {
  return { name, type, oldVersion, newVersion, changesets: ['brave-cats-run'] };
}

const widenMessage = (name: string, range: string, version: string) =>
  `${GENUI} peerDependencies["${name}"] "${range}" does not admit ${version}, which the pending changesets release. Widen both peer ranges in packages/line-genui/package.json, for example "|| ^0.3.0", in this PR (Phase 1 spec §7.2, SD76).`;

describe('checkPeerRanges', () => {
  test('a release inside the range passes', () => {
    expect(checkPeerRanges([release(COMPONENTS, 'patch', '0.2.8', '0.2.9')], PEERS)).toEqual([]);
  });

  test('a line-components release outside the range fails with the SD76 message', () => {
    expect(checkPeerRanges([release(COMPONENTS, 'minor', '0.2.8', '0.3.0')], PEERS)).toEqual([
      widenMessage(COMPONENTS, UNION, '0.3.0'),
    ]);
  });

  test('a line-icons release outside the range fails with the SD76 message', () => {
    expect(checkPeerRanges([release(ICONS, 'minor', '0.2.2', '0.3.0')], PEERS)).toEqual([
      widenMessage(ICONS, UNION, '0.3.0'),
    ]);
  });

  test('both peers outside the range fail with one message each', () => {
    const releases = [release(COMPONENTS, 'minor', '0.2.8', '0.3.0'), release(ICONS, 'minor', '0.2.2', '0.3.0')];
    expect(checkPeerRanges(releases, PEERS)).toEqual([
      widenMessage(COMPONENTS, UNION, '0.3.0'),
      widenMessage(ICONS, UNION, '0.3.0'),
    ]);
  });

  test('an empty plan, as an empty changeset gives, passes', () => {
    expect(checkPeerRanges([], PEERS)).toEqual([]);
  });

  test('a plan that releases neither peer passes', () => {
    const releases = [
      release('@websublime/line-core', 'minor', '0.2.3', '0.3.0'),
      release(GENUI, 'patch', '0.2.0', '0.2.1'),
    ];
    expect(checkPeerRanges(releases, PEERS)).toEqual([]);
  });

  test('a none release of a peer passes, even at a version outside the range', () => {
    expect(checkPeerRanges([release(COMPONENTS, 'none', '0.3.0', '0.3.0')], PEERS)).toEqual([]);
  });

  test('a malformed range fails with its own message, though Bun.semver.satisfies accepts it', () => {
    expect(Bun.semver.satisfies('0.3.0', 'garbage')).toBe(true);
    const failures = checkPeerRanges([release(COMPONENTS, 'patch', '0.2.8', '0.2.9')], {
      ...PEERS,
      [COMPONENTS]: 'garbage',
    });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain(`${GENUI} peerDependencies["${COMPONENTS}"] "garbage" is not one "^<x.y.z>" arm`);
  });

  test('a range that keeps a workspace: prefix after the strip is malformed', () => {
    expect(Bun.semver.satisfies('0.3.0', 'workspace:^0.2.0')).toBe(true);
    const failures = checkPeerRanges([release(COMPONENTS, 'minor', '0.2.8', '0.3.0')], {
      ...PEERS,
      [COMPONENTS]: 'workspace:workspace:^0.2.0',
    });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('is not one "^<x.y.z>" arm');
  });

  test('a missing peer entry fails with its own message', () => {
    const failures = checkPeerRanges([release(ICONS, 'patch', '0.2.2', '0.2.3')], { [COMPONENTS]: UNION });
    expect(failures).toEqual([
      `${GENUI} peerDependencies["${ICONS}"] is missing, so it cannot admit 0.2.3 (Phase 1 spec §7.2, SD76).`,
    ]);
  });

  test('a missing peerDependencies field fails for every released peer', () => {
    const failures = checkPeerRanges([release(COMPONENTS, 'patch', '0.2.8', '0.2.9')], undefined);
    expect(failures).toEqual([
      `${GENUI} peerDependencies["${COMPONENTS}"] is missing, so it cannot admit 0.2.9 (Phase 1 spec §7.2, SD76).`,
    ]);
  });

  test('an empty peer entry fails with its own message, though Bun.semver.satisfies accepts it', () => {
    expect(Bun.semver.satisfies('0.3.0', '')).toBe(true);
    const failures = checkPeerRanges([release(COMPONENTS, 'patch', '0.2.8', '0.2.9')], {
      ...PEERS,
      [COMPONENTS]: '',
    });
    expect(failures).toEqual([
      `${GENUI} peerDependencies["${COMPONENTS}"] is empty, so it cannot admit 0.2.9 (Phase 1 spec §7.2, SD76).`,
    ]);
  });

  test('the manifest value workspace:^0.1.0 || ^0.2.0 admits 0.2.9', () => {
    expect(checkPeerRanges([release(COMPONENTS, 'patch', '0.2.8', '0.2.9')], { [COMPONENTS]: UNION })).toEqual([]);
  });

  test('the manifest value workspace:^0.1.0 || ^0.2.0 does not admit 0.3.0', () => {
    expect(checkPeerRanges([release(COMPONENTS, 'minor', '0.2.8', '0.3.0')], { [COMPONENTS]: UNION })).toEqual([
      widenMessage(COMPONENTS, UNION, '0.3.0'),
    ]);
  });

  test('the single arm workspace:^0.3.0 admits 0.3.1', () => {
    const peers = { [COMPONENTS]: 'workspace:^0.3.0' };
    expect(checkPeerRanges([release(COMPONENTS, 'patch', '0.3.0', '0.3.1')], peers)).toEqual([]);
  });

  test('the single arm workspace:^0.3.0 does not admit 0.4.0', () => {
    const peers = { [COMPONENTS]: 'workspace:^0.3.0' };
    expect(checkPeerRanges([release(COMPONENTS, 'minor', '0.3.0', '0.4.0')], peers)).toEqual([
      widenMessage(COMPONENTS, 'workspace:^0.3.0', '0.4.0'),
    ]);
  });
});

describe('pendingChangesets', () => {
  test('counts every *.md except README.md', () => {
    expect(pendingChangesets(['README.md', 'config.json', 'brave-cats-run.md', 'notes.txt'])).toEqual([
      'brave-cats-run.md',
    ]);
  });
});

describe('verifyPeerRanges', () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  function changesetDir(files: string[]): string {
    dir = mkdtempSync(join(tmpdir(), 'verify-peer-ranges-test-'));
    for (const file of files) writeFileSync(join(dir, file), file.endsWith('.json') ? '{}' : '---\n---\n');
    return dir;
  }

  test('a .changeset/ with only README.md and config.json passes without running changeset status', () => {
    let calls = 0;
    const result = verifyPeerRanges({
      changesetDir: changesetDir(['README.md', 'config.json']),
      runStatus: () => {
        calls++;
        return { exitCode: 1, output: 'Some packages have been changed but no changesets were found.', plan: null };
      },
      readPeerDependencies: () => PEERS,
    });
    expect(calls).toBe(0);
    expect(result.exitCode).toBe(0);
  });

  test('a pending changeset runs changeset status and checks its plan', () => {
    let calls = 0;
    const result = verifyPeerRanges({
      changesetDir: changesetDir(['README.md', 'config.json', 'brave-cats-run.md']),
      runStatus: () => {
        calls++;
        return { exitCode: 0, output: '', plan: { releases: [release(COMPONENTS, 'minor', '0.2.8', '0.3.0')] } };
      },
      readPeerDependencies: () => PEERS,
    });
    expect(calls).toBe(1);
    expect(result).toEqual({ exitCode: 1, messages: [widenMessage(COMPONENTS, UNION, '0.3.0')] });
  });

  test('past the early pass, a failing changeset status fails with its output', () => {
    const output = 'Failed to find where HEAD diverged from "main"';
    const result = verifyPeerRanges({
      changesetDir: changesetDir(['README.md', 'config.json', 'brave-cats-run.md']),
      runStatus: () => ({ exitCode: 1, output, plan: null }),
      readPeerDependencies: () => PEERS,
    });
    expect(result.exitCode).toBe(1);
    expect(result.messages).toContain(output);
  });
});
