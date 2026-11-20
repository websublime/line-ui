#!/usr/bin/env bun

/**
 * scripts/release-records.mjs — reports the `release-records` commit status on a PR head (ledger 01-Z10).
 *
 * Spec: docs/specs/01-spec-core-primitives.md §7.2, the `release-records` contract (§12 AM-114).
 *
 *   PR_NUMBER=<n> GITHUB_TOKEN=<token> GITHUB_REPOSITORY=<owner/repo> bun run scripts/release-records.mjs
 *
 * A PR that is not the Version PR gets `success`. The Version PR gets `success` only when its record, the
 * latest marker comment by an admin and last edited by an admin, cites one passing `workflow_dispatch` run on
 * the `main` tip of each release-time workflow and carries the Anthropic live-call line. Every fact comes from
 * the GitHub API; `evaluate` turns the facts into the status and does no I/O.
 */

export const STATUS_CONTEXT = 'release-records';
export const MARKER = '<!-- line-ui:release-records -->';
export const VERSION_PR_REF = 'changeset-release/main';

/** The release-time workflows a record cites, in the order the description names them. */
export const WORKFLOWS = [
  { name: 'snapshot-deploy', path: '.github/workflows/snapshot-deploy.yml' },
  { name: 'cdn-check', path: '.github/workflows/cdn-check.yml' },
  { name: 'visual-off-pairs', path: '.github/workflows/visual-off-pairs.yml' },
];

const CDN_TITLE = /^cdn-check line-components@(.*)$/;
const RUN_URL = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/actions\/runs\/(\d+)/g;
const DESCRIPTION_MAX = 140;

/** True when the PR is the Changesets Version PR of `repository`; a fork with the same ref is not. */
export function isVersionPr(pr, repository) {
  return pr.headRef === VERSION_PR_REF && pr.headRepo?.toLowerCase() === repository.toLowerCase();
}

/**
 * The latest marker comment whose author is an admin and whose last editor, if it was edited, is an admin.
 * Other marker comments are skipped, so a stranger's comment can neither be the record nor hide it.
 * @param {Array<{ body: string, authorAdmin: boolean, edited: boolean, editorAdmin: boolean }>} comments
 *   in creation order
 */
export function selectRecord(comments) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    if (!comment.body.includes(MARKER)) continue;
    if (comment.authorAdmin && (!comment.edited || comment.editorAdmin)) return comment;
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

/** One line that names Anthropic and holds an ISO date, `<n> tools` and `passed`. */
export function hasAnthropicLine(body) {
  return body
    .split('\n')
    .some(
      (line) =>
        /anthropic/i.test(line) &&
        /\b\d{4}-\d{2}-\d{2}\b/.test(line) &&
        /\b[1-9]\d* tools?\b/.test(line) &&
        /\bpassed\b/i.test(line),
    );
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
 * The status for one PR.
 * @param {{
 *   repository: string,
 *   pr: { headRef: string, headRepo: string | null },
 *   mainSha?: string,
 *   comments?: Array<{ body: string, authorAdmin: boolean, edited: boolean, editorAdmin: boolean }>,
 *   runs?: Record<number, { path: string, status?: string, conclusion: string | null, event: string,
 *     head_branch: string, head_sha: string, display_title: string } | null>,
 *   versions?: { head: string | null, base: string | null },
 * }} facts `runs` holds every run the record cites, `null` for one the API does not find; `versions` holds
 *   the `line-components` version at the Version PR head and at the base sha
 * @returns {{ state: 'success' | 'failure', description: string }}
 */
export function evaluate({ repository, pr, mainSha = '', comments = [], runs = {}, versions = {} }) {
  if (!isVersionPr(pr, repository)) return { state: 'success', description: 'Not a Version PR' };

  const record = selectRecord(comments);
  if (!record) return { state: 'failure', description: 'No admin comment carries the release-records marker' };

  const problems = [];
  const { ids, foreign } = citedRuns(record.body, repository);
  if (foreign.length > 0) problems.push(`cites a run outside ${repository}`);
  problems.push(...citedRunProblems(ids, runs, versions, mainSha));

  if (!hasAnthropicLine(record.body)) problems.push('no Anthropic line (date, <n> tools, passed)');

  if (problems.length > 0) return { state: 'failure', description: describe(problems) };
  return { state: 'success', description: `Records cite runs on main ${mainSha.slice(0, 7)}` };
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
        nodes { body lastEditedAt author { login } editor { login } }
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

async function gatherFacts(gh, repository, number, pr) {
  const facts = { repository, pr };
  if (!isVersionPr(pr, repository)) return facts;

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
    const edited = node.lastEditedAt !== null;
    facts.comments.push({
      body: node.body,
      authorAdmin: marked && (await isAdmin(node.author?.login)),
      edited,
      editorAdmin: marked && edited && (await isAdmin(node.editor?.login)),
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
  const pr = { headRef: raw.head.ref, headRepo: raw.head.repo?.full_name ?? null, headSha: raw.head.sha };
  const post = (state, description) =>
    gh.request('POST', `/repos/${repository}/statuses/${pr.headSha}`, {
      body: { state, description, context: STATUS_CONTEXT, target_url: targetUrl },
    });

  try {
    const { state, description } = evaluate(await gatherFacts(gh, repository, number, pr));
    await post(state, description);
    console.info(`${STATUS_CONTEXT}: PR #${number} ${pr.headSha} → ${state}: ${description}`);
  } catch (err) {
    // An evaluation that fails must not leave an earlier `success` standing on the head sha.
    await post('failure', 'Evaluation failed; see the workflow run').catch(() => {});
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
