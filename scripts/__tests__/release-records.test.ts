/**
 * release-records decision tests (ledger 01-Z10, Phase 1 spec §7.2, §12 AM-114).
 *
 * `evaluate(facts)` is the pure decision `scripts/release-records.mjs` runs after it reads the PR, the
 * `main` tip, the PR comments with their author and editor permissions, the cited runs and the
 * `line-components` versions from the API. No network: every fact is a literal.
 *
 * @module scripts/__tests__/release-records
 */

import { describe, expect, test } from 'bun:test';
import { evaluate, expectedCdnVersion, MARKER, selectRecord, VERSION_PR_REF } from '../release-records.mjs';

type Run = {
  path: string;
  status?: string;
  conclusion: string | null;
  event: string;
  head_branch: string;
  head_sha: string;
  display_title: string;
};
type Comment = { body: string; authorAdmin: boolean; edited: boolean; editorAdmin: boolean };

const REPO = 'websublime/line-ui';
const MAIN = '6c944036865ca09b1e19c0d2eb8e871d016538e1';
const OTHER = '0123456789abcdef0123456789abcdef01234567';
const VERSIONS = { head: '0.2.8', base: '0.2.7' };
const CANARY = `0.2.8-${MAIN}-SNAPSHOT`;

const VERSION_PR = { headRef: VERSION_PR_REF, headRepo: REPO };
const url = (id: number, repo = REPO) => `https://github.com/${repo}/actions/runs/${id}`;

const run = (file: string, overrides: Partial<Run> = {}): Run => ({
  path: `.github/workflows/${file}`,
  status: 'completed',
  conclusion: 'success',
  event: 'workflow_dispatch',
  head_branch: 'main',
  head_sha: MAIN,
  display_title: file.replace('.yml', ''),
  ...overrides,
});

const RUNS: Record<number, Run> = {
  1: run('snapshot-deploy.yml'),
  2: run('cdn-check.yml', { display_title: `cdn-check line-components@${CANARY}` }),
  3: run('visual-off-pairs.yml'),
};

const ANTHROPIC = 'Anthropic live call 2026-11-20: 17 tools, passed';
const body = (ids = [1, 2, 3], extra = ANTHROPIC) => [MARKER, ...ids.map((id) => `- ${url(id)}`), extra].join('\n');
const comment = (text = body(), overrides: Partial<Comment> = {}): Comment => ({
  body: text,
  authorAdmin: true,
  edited: false,
  editorAdmin: false,
  ...overrides,
});

const versionPr = (overrides: Record<string, unknown> = {}) =>
  evaluate({
    repository: REPO,
    pr: VERSION_PR,
    mainSha: MAIN,
    comments: [comment()],
    runs: RUNS,
    versions: VERSIONS,
    ...overrides,
  });

const withRun = (id: number, overrides: Partial<Run>) =>
  versionPr({ runs: { ...RUNS, [id]: { ...RUNS[id], ...overrides } } });

describe('PRs that are not the Version PR', () => {
  test('another head ref gets success without any record', () => {
    expect(evaluate({ repository: REPO, pr: { headRef: 'feat/01-c1-button', headRepo: REPO } })).toEqual({
      state: 'success',
      description: 'Not a Version PR',
    });
  });

  test.each([
    ['a fork with the Version PR ref', { headRef: VERSION_PR_REF, headRepo: 'stranger/line-ui' }],
    ['a fork with another ref', { headRef: 'main', headRepo: 'stranger/line-ui' }],
    ['a deleted fork', { headRef: VERSION_PR_REF, headRepo: null }],
  ])('%s gets success', (_label, pr) => {
    expect(evaluate({ repository: REPO, pr }).state).toBe('success');
  });
});

describe('the record comment', () => {
  test('a valid record by an admin gives success on the main tip', () => {
    expect(versionPr()).toEqual({ state: 'success', description: `Records cite runs on main ${MAIN.slice(0, 7)}` });
  });

  test('a Version PR without a marker comment fails', () => {
    const result = versionPr({ comments: [comment(body().replace(MARKER, ''))] });
    expect(result.state).toBe('failure');
    expect(result.description).toBe('No admin comment carries the release-records marker');
  });

  test('a Version PR with no comments fails', () => {
    expect(versionPr({ comments: [] }).state).toBe('failure');
  });

  test('a marker comment by a non-admin alone fails', () => {
    expect(versionPr({ comments: [comment(body(), { authorAdmin: false })] }).state).toBe('failure');
  });

  test("a later stranger's marker comment is skipped, so the admin record still counts", () => {
    const stranger = comment(`${MARKER}\nnothing here`, { authorAdmin: false });
    expect(versionPr({ comments: [comment(), stranger] }).state).toBe('success');
  });

  test('the latest admin marker comment is the record, even when an earlier one was valid', () => {
    const invalid = comment(body([1, 2]));
    expect(versionPr({ comments: [comment(), invalid] })).toMatchObject({
      state: 'failure',
      description: 'no visual-off-pairs run',
    });
  });

  test('an admin comment edited by a non-admin is skipped', () => {
    const edited = comment(body(), { edited: true, editorAdmin: false });
    expect(selectRecord([edited])).toBeNull();
    expect(versionPr({ comments: [edited] }).state).toBe('failure');
  });

  test('an admin comment edited by a non-admin falls back to the earlier admin record', () => {
    const earlier = comment();
    const edited = comment(body([1]), { edited: true, editorAdmin: false });
    expect(selectRecord([earlier, edited])).toBe(earlier);
    expect(versionPr({ comments: [earlier, edited] }).state).toBe('success');
  });

  test('an admin comment edited by an admin counts', () => {
    expect(versionPr({ comments: [comment(body(), { edited: true, editorAdmin: true })] }).state).toBe('success');
  });

  test('a deleted record leaves no record, so the PR fails', () => {
    const other = { body: 'LGTM', authorAdmin: true, edited: false, editorAdmin: false };
    expect(versionPr({ comments: [other] }).state).toBe('failure');
  });
});

describe('the cited runs', () => {
  test.each<[string, number, Partial<Run>, string]>([
    ['a wrong workflow', 1, { path: '.github/workflows/checks.yml' }, 'run 1 is not a release-time workflow'],
    ['a run that did not succeed', 3, { conclusion: 'failure' }, 'visual-off-pairs run is failure'],
    ['a run still in progress', 3, { status: 'in_progress', conclusion: null }, 'visual-off-pairs run is in_progress'],
    ['a run that is not workflow_dispatch', 3, { event: 'push' }, 'visual-off-pairs run is a push run'],
    ['a run that is not on main', 1, { head_branch: 'feat/x' }, 'snapshot-deploy run is on feat/x'],
    ['a run on another sha', 3, { head_sha: OTHER }, `visual-off-pairs run is not on main ${MAIN.slice(0, 7)}`],
  ])('%s fails', (_label, id, overrides, description) => {
    const result = withRun(id, overrides);
    expect(result.state).toBe('failure');
    expect(result.description).toContain(description);
  });

  test('a run path with a ref suffix still names its workflow', () => {
    expect(withRun(3, { path: '.github/workflows/visual-off-pairs.yml@refs/heads/main' }).state).toBe('success');
  });

  test('a missing snapshot-deploy run fails', () => {
    expect(versionPr({ comments: [comment(body([2, 3]))] })).toEqual({
      state: 'failure',
      description: 'no snapshot-deploy run',
    });
  });

  test('two runs of one workflow fail', () => {
    const runs = { ...RUNS, 4: run('visual-off-pairs.yml') };
    expect(versionPr({ comments: [comment(body([1, 2, 3, 4]))], runs })).toMatchObject({
      state: 'failure',
      description: '2 visual-off-pairs runs',
    });
  });

  test('a cited run the API does not find fails', () => {
    expect(versionPr({ comments: [comment(body([1, 2, 3, 9]))], runs: { ...RUNS, 9: null } }).description).toContain(
      'run 9 not found',
    );
  });

  test('a run URL of another repository fails', () => {
    const text = `${body()}\n${url(5, 'stranger/line-ui')}`;
    expect(versionPr({ comments: [comment(text)] }).description).toContain(`cites a run outside ${REPO}`);
  });

  test('a run cited twice, or through a job URL, counts once', () => {
    const text = `${body()}\n${url(2)}/job/77\n${url(1)}`;
    expect(versionPr({ comments: [comment(text)] }).state).toBe('success');
  });
});

describe('the cdn-check version', () => {
  test('the canary of the base sha is expected when the Version PR releases line-components', () => {
    expect(expectedCdnVersion(VERSIONS, MAIN)).toBe(CANARY);
  });

  test('the base-sha version is expected when the Version PR does not release line-components', () => {
    expect(expectedCdnVersion({ head: '0.2.7', base: '0.2.7' }, MAIN)).toBe('0.2.7');
  });

  test('the latest version instead of the canary fails', () => {
    expect(withRun(2, { display_title: 'cdn-check line-components@0.2.7' })).toEqual({
      state: 'failure',
      description: `cdn-check tested 0.2.7, expected ${CANARY}`,
    });
  });

  test('a canary of another sha fails', () => {
    expect(withRun(2, { display_title: `cdn-check line-components@0.2.8-${OTHER}-SNAPSHOT` }).state).toBe('failure');
  });

  test('the base-sha version passes when the Version PR does not release line-components', () => {
    const runs = { ...RUNS, 2: run('cdn-check.yml', { display_title: 'cdn-check line-components@0.2.7' }) };
    expect(versionPr({ runs, versions: { head: '0.2.7', base: '0.2.7' } }).state).toBe('success');
  });

  test('a canary fails when the Version PR does not release line-components', () => {
    const result = versionPr({ versions: { head: '0.2.7', base: '0.2.7' } });
    expect(result).toEqual({ state: 'failure', description: `cdn-check tested ${CANARY}, expected 0.2.7` });
  });

  test.each([
    ['an empty version', 'cdn-check line-components@'],
    ['a run without the run-name', 'cdn-check'],
  ])('%s fails', (_label, display_title) => {
    expect(withRun(2, { display_title })).toEqual({
      state: 'failure',
      description: 'cdn-check run names no line-components version',
    });
  });

  test('an unreadable line-components version fails', () => {
    expect(versionPr({ versions: { head: null, base: '0.2.7' } }).description).toBe(
      'line-components version unreadable',
    );
  });
});

describe('the Anthropic live-call line', () => {
  test.each([
    ['missing', ''],
    ['without a date', 'Anthropic live call: 17 tools, passed'],
    ['without a tool count', 'Anthropic live call 2026-11-20: passed'],
    ['without passed', 'Anthropic live call 2026-11-20: 17 tools, failed'],
    ['split over two lines', 'Anthropic live call 2026-11-20\n17 tools, passed'],
  ])('%s fails', (_label, line) => {
    expect(versionPr({ comments: [comment(body([1, 2, 3], line))] })).toEqual({
      state: 'failure',
      description: 'no Anthropic line (date, <n> tools, passed)',
    });
  });
});

test('the description names every problem and stays within the 140 characters GitHub accepts', () => {
  const result = versionPr({ comments: [comment(`${MARKER}\n${url(5, 'stranger/line-ui')}`)] });
  expect(result.state).toBe('failure');
  expect(result.description.length).toBeLessThanOrEqual(140);
  expect(result.description.startsWith(`cites a run outside ${REPO}; no snapshot-deploy run`)).toBe(true);
});
