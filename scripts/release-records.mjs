#!/usr/bin/env bun

/**
 * scripts/release-records.mjs — reports the `release-records` commit status on a PR head (ledger 01-Z10).
 *
 * Spec: docs/specs/01-spec-core-primitives.md §7.2, the `release-records` contract (§12 AM-114).
 *
 *   PR_NUMBER=<n> GITHUB_TOKEN=<token> GITHUB_REPOSITORY=<owner/repo> bun run scripts/release-records.mjs
 *
 * A PR that is not the Version PR gets `success`, or no status at all when its head sha is the Version PR's,
 * because a status belongs to the sha. The Version PR gets `success` only when its record, the latest marker
 * comment whose author and last editor are admins, cites one passing `workflow_dispatch` run on the `main` tip
 * of each release-time workflow and no other run. Other comment text is prose, read only for run URLs, each of
 * which counts as a citation (§12 AM-122). Every fact comes from the GitHub API; `evaluate` turns the facts into
 * the status and does no I/O. A run posts only when the status changes.
 */

export const STATUS_CONTEXT = 'release-records';
export const MARKER = '<!-- line-ui:release-records -->';
export const VERSION_PR_REF = 'changeset-release/main';
/** The GitHub Actions bot, which opens the Version PR and posts this workflow's statuses. */
export const ACTIONS_BOT = 'github-actions[bot]';

/** The release-time workflows a record cites, in the order the description names them. */
export const WORKFLOWS = [
  { name: 'snapshot-deploy', path: '.github/workflows/snapshot-deploy.yml' },
  { name: 'cdn-check', path: '.github/workflows/cdn-check.yml' },
  { name: 'visual-off-pairs', path: '.github/workflows/visual-off-pairs.yml' },
];

const CDN_TITLE = /^cdn-check line-components@(.*)$/;
const RUN_URL = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/actions\/runs\/(\d+)/g;
const DESCRIPTION_MAX = 140;

/** The PR facts the decision reads, from a `GET /pulls/{n}` or `GET /pulls` item. */
export function prFacts(raw) {
  return {
    headRef: raw.head.ref,
    headRepo: raw.head.repo?.full_name ?? null,
    headSha: raw.head.sha,
    baseRef: raw.base.ref,
    state: raw.state,
    author: raw.user?.login ?? null,
  };
}

/**
 * True only for the Changesets Version PR of `repository`, the open PR from its `changeset-release/main` into
 * `main` that `github-actions[bot]` opened. GitHub allows one open PR per head and base, so a fork, a duplicate
 * into another base, a closed PR or a hand-opened PR from that branch is not it.
 */
export function isVersionPr(pr, repository) {
  return (
    pr.headRef === VERSION_PR_REF &&
    pr.headRepo?.toLowerCase() === repository.toLowerCase() &&
    pr.baseRef === 'main' &&
    pr.state === 'open' &&
    pr.author === ACTIONS_BOT
  );
}

/**
 * The login of a comment's last editor. GraphQL lists `userContentEdits` newest first, so the first entry is
 * the last edit; a comment that was never edited falls back to its author.
 * @param {{ author: { login: string } | null, userContentEdits: { nodes: Array<{ editor: { login: string } | null }> } }} node
 */
export function lastEditor(node) {
  const edit = node.userContentEdits.nodes[0];
  return (edit ? edit.editor?.login : node.author?.login) ?? null;
}

/**
 * The latest marker comment whose author and last editor are admins. Other marker comments are skipped, so a
 * stranger's comment can neither be the record nor hide it.
 * @param {Array<{ body: string, authorAdmin: boolean, editorAdmin: boolean }>} comments in creation order
 */
export function selectRecord(comments) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    if (!comment.body.includes(MARKER)) continue;
    if (comment.authorAdmin && comment.editorAdmin) return comment;
  }
  return null;
}

/** Distinct run ids the body cites for `repository`, and the run URLs it cites for any other repository. */
export function citedRuns(body, repository) {
  const ids = new Set();
  const foreign = new Set();
  for (const [url, repo, id] of body.matchAll(RUN_URL)) {
    if (repo.toLowerCase() === repository.toLowerCase()) ids.add(Number(id));
    else foreign.add(url);
  }
  return { ids: [...ids], foreign: [...foreign] };
}

/**
 * The `line-components` version the `cdn-check.yml` run must test. The canary of the base sha when the
 * Version PR releases `line-components`, else the base-sha version that npm `latest` serves.
 */
export function expectedCdnVersion({ head, base }, baseSha) {
  return head === base ? base : `${head}-${baseSha}-SNAPSHOT`;
}

function workflowPath(run) {
  return run.path.split('@', 1)[0];
}

function runProblems(workflow, run, baseSha) {
  const problems = [];
  if (run.conclusion !== 'success') problems.push(`${workflow.name} run is ${run.conclusion ?? run.status}`);
  if (run.event !== 'workflow_dispatch') problems.push(`${workflow.name} run is a ${run.event} run`);
  if (run.head_branch !== 'main') problems.push(`${workflow.name} run is on ${run.head_branch}`);
  else if (run.head_sha !== baseSha) problems.push(`${workflow.name} run is not on main ${baseSha.slice(0, 7)}`);
  return problems;
}

function cdnProblems(run, versions, baseSha) {
  const tested = CDN_TITLE.exec(run.display_title)?.[1];
  if (!tested) return ['cdn-check run names no line-components version'];
  if (!(versions.head && versions.base)) return ['line-components version unreadable'];
  const expected = expectedCdnVersion(versions, baseSha);
  return tested === expected ? [] : [`cdn-check tested ${tested}, expected ${expected}`];
}

/** Problems with the cited runs: unknown or unrelated runs, then one run per workflow, checked in order. */
function citedRunProblems(ids, runs, versions, baseSha) {
  const problems = [];
  const byWorkflow = new Map(WORKFLOWS.map((w) => [w.path, []]));
  for (const id of ids) {
    const run = runs[id];
    if (!run) problems.push(`run ${id} not found`);
    else if (byWorkflow.has(workflowPath(run))) byWorkflow.get(workflowPath(run)).push(run);
    else problems.push(`run ${id} is not a release-time workflow`);
  }

  for (const workflow of WORKFLOWS) {
    const cited = byWorkflow.get(workflow.path);
    if (cited.length === 0) problems.push(`no ${workflow.name} run`);
    else if (cited.length > 1) problems.push(`${cited.length} ${workflow.name} runs`);
    else {
      problems.push(...runProblems(workflow, cited[0], baseSha));
      if (workflow.name === 'cdn-check') problems.push(...cdnProblems(cited[0], versions, baseSha));
    }
  }
  return problems;
}

function describe(problems) {
  const text = problems.join('; ');
  return text.length <= DESCRIPTION_MAX ? text : `${text.slice(0, DESCRIPTION_MAX - 1)}…`;
}

/**
 * The status for one PR, or `null` when the PR must get no status.
 * @param {{
 *   repository: string,
 *   pr: { headRef: string, headRepo: string | null, headSha: string, baseRef: string, state: string,
 *     author: string | null },
 *   versionPrShas?: string[],
 *   mainSha?: string,
 *   comments?: Array<{ body: string, authorAdmin: boolean, editorAdmin: boolean }>,
 *   runs?: Record<number, { path: string, status?: string, conclusion: string | null, event: string,
 *     head_branch: string, head_sha: string, display_title: string } | null>,
 *   versions?: { head: string | null, base: string | null },
 * }} facts `versionPrShas` holds the `changeset-release/main` tip and the head sha of each open PR from it;
 *   `runs` holds every run the record cites, `null` for one the API does not find; `versions` holds the
 *   `line-components` version at the Version PR head and at the base sha
 * @returns {{ state: 'success' | 'failure', description: string } | null}
 */
export function evaluate({
  repository,
  pr,
  versionPrShas = [],
  mainSha = '',
  comments = [],
  runs = {},
  versions = {},
}) {
  if (!isVersionPr(pr, repository)) {
    // A status on the Version PR's sha would stand for the Version PR, whichever PR posted it.
    if (versionPrShas.includes(pr.headSha)) return null;
    return { state: 'success', description: 'Not a Version PR' };
  }

  const record = selectRecord(comments);
  if (!record) return { state: 'failure', description: 'No admin comment carries the release-records marker' };

  const problems = [];
  const { ids, foreign } = citedRuns(record.body, repository);
  if (foreign.length > 0) problems.push(`cites a run outside ${repository}`);
  problems.push(...citedRunProblems(ids, runs, versions, mainSha));

  if (problems.length > 0) return { state: 'failure', description: describe(problems) };
  return { state: 'success', description: `Records cite runs on main ${mainSha.slice(0, 7)}` };
}

/**
 * The latest `release-records` status this workflow posted, from a sha's statuses listed newest first, or
 * `null`. A status anyone else posted never counts.
 * @param {Array<{ context: string, state: string, description: string | null, creator: { login: string } | null }>} statuses
 */
export function currentStatus(statuses) {
  const own = statuses.find((s) => s.context === STATUS_CONTEXT && s.creator?.login === ACTIONS_BOT);
  return own ? { state: own.state, description: own.description ?? '' } : null;
}

/** True when `result` differs from the status already on the sha, so a repeat costs no write. */
export function needsPost(result, current) {
  return current === null || current.state !== result.state || current.description !== result.description;
}

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function client(token) {
  const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'line-ui-release-records',
  };

  async function request(method, path, { body, accept, allow404 = false } = {}) {
    const res = await fetch(`${api}${path}`, {
      method,
      headers: { ...headers, ...(accept ? { accept } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (allow404 && res.status === 404) return null;
    if (!res.ok) throw new Error(`${method} ${path} returned ${res.status}`);
    return accept === 'application/vnd.github.raw+json' ? res.text() : res.json();
  }

  async function graphql(query, variables) {
    const res = await request('POST', '/graphql', { body: { query, variables } });
    if (res.errors?.length) throw new Error(`GraphQL: ${res.errors.map((e) => e.message).join('; ')}`);
    return res.data;
  }

  return { request, graphql };
}

const COMMENTS_QUERY = `query($owner: String!, $name: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      comments(first: 100, after: $after) {
        nodes { body author { login } userContentEdits(first: 1) { nodes { editor { login } } } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

async function readComments(gh, repository, number) {
  const [owner, name] = repository.split('/');
  const nodes = [];
  let after = null;
  do {
    const data = await gh.graphql(COMMENTS_QUERY, { owner, name, number, after });
    const page = data.repository.pullRequest.comments;
    nodes.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}

async function readComponentsVersion(gh, repository, ref) {
  const text = await gh.request(
    'GET',
    `/repos/${repository}/contents/packages/line-components/package.json?ref=${encodeURIComponent(ref)}`,
    { accept: 'application/vnd.github.raw+json', allow404: true },
  );
  const version = text === null ? null : JSON.parse(text).version;
  return typeof version === 'string' && version !== '' ? version : null;
}

/** The `changeset-release/main` tip of this repository and the head sha of each open Version PR. */
async function readVersionPrShas(gh, repository) {
  const [owner] = repository.split('/');
  const branch = await gh.request('GET', `/repos/${repository}/branches/${VERSION_PR_REF}`, { allow404: true });
  const open = await gh.request(
    'GET',
    `/repos/${repository}/pulls?state=open&per_page=100&head=${encodeURIComponent(`${owner}:${VERSION_PR_REF}`)}`,
  );
  const versionPrs = open.map(prFacts).filter((pr) => isVersionPr(pr, repository));
  return [...(branch ? [branch.commit.sha] : []), ...versionPrs.map((pr) => pr.headSha)];
}

async function gatherFacts(gh, repository, number, pr) {
  const facts = { repository, pr };
  if (!isVersionPr(pr, repository)) {
    facts.versionPrShas = await readVersionPrShas(gh, repository);
    return facts;
  }

  facts.mainSha = (await gh.request('GET', `/repos/${repository}/branches/main`)).commit.sha;

  const admins = new Map();
  const isAdmin = async (login) => {
    if (!login) return false;
    if (!admins.has(login)) {
      const res = await gh.request(
        'GET',
        `/repos/${repository}/collaborators/${encodeURIComponent(login)}/permission`,
        {
          allow404: true,
        },
      );
      admins.set(login, res?.permission === 'admin');
    }
    return admins.get(login);
  };

  facts.comments = [];
  for (const node of await readComments(gh, repository, number)) {
    const marked = node.body.includes(MARKER);
    facts.comments.push({
      body: node.body,
      authorAdmin: marked && (await isAdmin(node.author?.login)),
      editorAdmin: marked && (await isAdmin(lastEditor(node))),
    });
  }

  facts.runs = {};
  const record = selectRecord(facts.comments);
  if (record) {
    for (const id of citedRuns(record.body, repository).ids) {
      facts.runs[id] = await gh.request('GET', `/repos/${repository}/actions/runs/${id}`, { allow404: true });
    }
  }

  facts.versions = {
    head: await readComponentsVersion(gh, repository, pr.headSha),
    base: await readComponentsVersion(gh, repository, facts.mainSha),
  };
  return facts;
}

async function main() {
  const repository = env('GITHUB_REPOSITORY');
  const number = Number(env('PR_NUMBER'));
  const gh = client(env('GITHUB_TOKEN'));
  const targetUrl = `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;

  const raw = await gh.request('GET', `/repos/${repository}/pulls/${number}`);
  const pr = prFacts(raw);
  const post = (state, description) =>
    gh.request('POST', `/repos/${repository}/statuses/${pr.headSha}`, {
      body: { state, description, context: STATUS_CONTEXT, target_url: targetUrl },
    });

  // A failed evaluation posts `failure`, so no earlier `success` stays on the head sha. It posts nothing on a
  // PR whose head may be the Version PR's sha until `evaluate` has ruled that out.
  let mayPost = isVersionPr(pr, repository);
  try {
    const result = evaluate(await gatherFacts(gh, repository, number, pr));
    if (result === null) {
      console.info(`${STATUS_CONTEXT}: PR #${number} ${pr.headSha} is the Version PR's head; no status`);
      return;
    }
    mayPost = true;

    const statuses = await gh.request('GET', `/repos/${repository}/commits/${pr.headSha}/statuses?per_page=100`);
    if (!needsPost(result, currentStatus(statuses))) {
      console.info(`${STATUS_CONTEXT}: PR #${number} ${pr.headSha} already ${result.state}: ${result.description}`);
      return;
    }
    await post(result.state, result.description);
    console.info(`${STATUS_CONTEXT}: PR #${number} ${pr.headSha} → ${result.state}: ${result.description}`);
  } catch (err) {
    if (mayPost) await post('failure', 'Evaluation failed; see the workflow run').catch(() => {});
    throw err;
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    console.error(`release-records: ${err.message}`);
    process.exit(1);
  }
}
