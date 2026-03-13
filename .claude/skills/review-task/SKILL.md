---
name: review-task
description: Code review gate — lists beads with needs-review label, dispatches the code-reviewer agent to analyze the implementation branch, and optionally dispatches the refactoring-supervisor to address findings. Handles the full review cycle from task selection to refactoring dispatch.
user_invocable: true
---

# Review Task

Dispatch a code review for a completed implementation. This is the orchestrator's entry point for the quality gate phase.

---

## Phase 1: Resolve Bead ID

If the user provides `$ARGUMENTS`, check if it contains a bead ID (e.g., `bd-a3f`, `bd-001.2`).

**If bead ID provided:** use it directly.

**If no bead ID provided:**
1. Run `bd list --label needs-review --json` to get beads awaiting review
2. Present the list to the user showing: ID, title, priority, and labels
3. If no beads with `needs-review` label found, inform the user and stop
4. Ask the user which task to review

**Validate** the bead exists and has status `in-review`:
```bash
bd show {BEAD_ID} --json
```

---

## Phase 2: Read Bead Context

1. Parse the bead JSON. Extract: `description`, `acceptance`, `design`, `notes`, `status`, `labels`
2. Read bead comments: `bd comments {BEAD_ID}`
3. Verify a `COMPLETED` comment exists — if not, warn user that the implementation supervisor did not leave a completion summary
4. Identify the implementation branch:
   ```bash
   git branch -a | grep {BEAD_ID}
   ```

---

## Phase 3: Dispatch Code Reviewer

Dispatch the code-reviewer agent to analyze the implementation:

```python
Task(
    subagent_type="code-reviewer",
    prompt="Review BEAD {BEAD_ID} on branch {branch-name}. Read the bead (bd show {BEAD_ID}) and comments (bd comments {BEAD_ID}) for full context — description, acceptance criteria, design notes, and the COMPLETED comment from the supervisor. Analyze the branch diff against acceptance criteria and log a structured REVIEW comment to the bead."
)
```

---

## Phase 4: Present Verdict

After the code-reviewer completes:

1. Read the REVIEW comment from bead comments: `bd comments {BEAD_ID}`
2. Extract the verdict: `APPROVE`, `NEEDS-REFACTORING`, or `NEEDS-REWORK`
3. Present the review summary to the user

**If APPROVE:**
- Inform user: "Code review passed. Ready for QA validation."
- Update labels:
  ```bash
  bd label remove {BEAD_ID} needs-review
  bd label add {BEAD_ID} approved
  ```
- Recommend: "Run `/qa-task {BEAD_ID}` to validate spec conformity, tests, build, and lint before merging."

**If NEEDS-REFACTORING:**
- Present findings to user
- Ask: "Do you want to dispatch the refactoring-supervisor to address these findings?"
- If yes → proceed to Phase 6
- If no → leave as-is for manual handling
- Label stays `needs-review` — Martin will re-label after refactoring

**If NEEDS-REWORK:**
- Present critical findings to user
- Inform: "This needs the implementation supervisor again — critical issues or acceptance criteria unmet. Use `/start-task {BEAD_ID}` to re-dispatch."
- Update labels:
  ```bash
  bd label remove {BEAD_ID} needs-review
  bd label add {BEAD_ID} needs-rework
  ```
- Do NOT dispatch refactoring-supervisor — this goes back to `/start-task`

---

## Phase 5: Track Review Findings

After the verdict is resolved (regardless of APPROVE, NEEDS-REFACTORING, or NEEDS-REWORK), extract actionable findings from the REVIEW comment and create tracked issues for anything that won't be addressed in the current cycle.

### When to run

- **APPROVE:** all non-`[GOOD]` findings are deferred — create issues for all of them
- **NEEDS-REFACTORING:** after the refactoring-supervisor completes, check for remaining `[SUGGESTION]` findings that were skipped — create issues for those
- **NEEDS-REWORK:** `[CRITICAL]` and `[WARNING]` findings will be addressed via `/start-task` rework, but any `[SUGGESTION]` findings should still be tracked

### Process

1. Parse the REVIEW comment for all findings that are NOT `[GOOD]`
2. **If the refactoring-supervisor ran (Phase 6)**, also parse the REFACTORING comment:
   - Extract all **SKIPPED** items — these are findings Martin could not fix (out of scope, architectural, risky)
   - Extract all **DEFERRED** items — these are findings Martin deferred with `// TODO(bd-xxx)` references
   - Remove from the REVIEW findings list any items that were **FIXED** by Martin (they're resolved)
   - SKIPPED items always become tracked findings
   - DEFERRED items are already tracked (Martin linked them to existing beads) — skip these
3. Filter out findings that were already addressed (FIXED by refactoring-supervisor, or that will be addressed by NEEDS-REWORK flow — i.e., `[CRITICAL]` and `[WARNING]` when verdict is NEEDS-REWORK)
4. For remaining findings, resolve the project's **Review Findings epic**:
   - Search for an open epic titled "Review Findings": `bd list --type epic --status open --json` and filter by title
   - If not found, create it:
     ```bash
     bd create "Review Findings" --type epic --description "Persistent epic for tracking suggestions, warnings, and improvement opportunities identified during code reviews that were not addressed in the current implementation cycle." --priority 3 --labels "findings"
     ```
   - Store the epic ID as `{FINDINGS_EPIC_ID}`
5. Dispatch **beads-owner** to create one issue per finding:
   ```python
   Task(
       subagent_type="beads-owner",
       prompt="Create beads issues for the following review findings from BEAD {BEAD_ID} review. Each issue should be created under parent {FINDINGS_EPIC_ID} with a discovered-from:{BEAD_ID} dependency. Use label 'finding:{severity}' (lowercase) for each — e.g., finding:suggestion, finding:warning, finding:critical. Include the file path and line number in the description. Findings:\n\n{FINDINGS_LIST}"
   )
   ```
6. Inform the user how many finding issues were created and under which epic

---

## Phase 6: Dispatch Refactoring (Optional)

Only if verdict is `NEEDS-REFACTORING` and user approves.

**Important:** After the refactoring-supervisor completes, return to Phase 5 to track any remaining findings that were not addressed.

```python
Task(
    subagent_type="refactoring-supervisor",
    prompt="Refactor BEAD {BEAD_ID}. Read the REVIEW comment in bead comments (bd comments {BEAD_ID}) for findings from the code-reviewer. Validate each finding before applying: check for false positives, cross-reference with existing beads for deferred work, and add TODO references for issues tracked in future tasks. Only fix validated real issues."
)
```
