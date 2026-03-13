---
name: qa-task
description: QA finalization gate — validates spec conformity, runs tests/build/lint, and produces a structured QA report. Dispatched after code review approves. Last gate before human merge.
user-invocable: true
---

# QA Task

Dispatch QA validation for a code-review-approved implementation. This is the orchestrator's entry point for the finalization gate.

---

## Phase 1: Resolve Bead ID

If the user provides `$ARGUMENTS`, check if it contains a bead ID (e.g., `bd-a3f`, `bd-001.2`).

**If bead ID provided:** use it directly.

**If no bead ID provided:**
1. Run `bd list --label approved --json` to get beads that passed code review
2. Present the list to the user showing: ID, title, priority, and labels
3. If no beads with `approved` label found, inform the user and stop
4. Ask the user which task to QA

**Validate** the bead has the `approved` label (meaning Linus has already approved the code):
```bash
bd show {BEAD_ID} --json
```

If the bead does NOT have the `approved` label, warn the user: "This task hasn't passed code review yet. Run `/review-task {BEAD_ID}` first."

---

## Phase 2: Read Bead Context

1. Parse the bead JSON. Extract: `description`, `acceptance`, `design`, `notes`, `status`, `labels`
2. Read bead comments: `bd comments {BEAD_ID}`
3. Verify a `REVIEW` comment exists with verdict `APPROVE` — if not, warn the user
4. Locate the spec/design doc:
   - Check bead's `design` field
   - If epic child, check parent epic: `bd show {EPIC_ID} --json`
5. If spec references a Source PRD, note the path
6. Identify the implementation branch:
   ```bash
   git branch -a | grep {BEAD_ID}
   ```

---

## Phase 3: Dispatch QA Gate

Dispatch the QA agent to validate the implementation:

```python
Task(
    subagent_type="qa-gate",
    prompt="QA validate BEAD {BEAD_ID} on branch {branch-name}. Spec: {spec_path}. PRD: {prd_path}. Read the bead (bd show {BEAD_ID}) and comments (bd comments {BEAD_ID}) for full context — description, acceptance criteria, design notes, COMPLETED, DECISION, DEVIATION, and REVIEW comments. Run tests, build, and lint. Log a structured QA comment to the bead."
)
```

---

## Phase 4: Present QA Results

After the QA agent completes:

1. Read the QA comment from bead comments: `bd comments {BEAD_ID}`
2. Extract the verdict: `PASS` or `FAIL`
3. Present the QA summary to the user

**If PASS:**
- Inform user: "QA passed. All checks green. The task is ready for merge."
- Update labels:
  ```bash
  bd label add {BEAD_ID} qa-passed
  ```
- Ask user: "Do you want to close this bead?"
  - If yes: `bd close {BEAD_ID}`
  - If no: leave open for manual merge workflow

**If FAIL:**
- Present the specific failure reasons to the user
- Ask user how to proceed:
  - **Rework**: "Send back to `/start-task {BEAD_ID}` for the supervisor to address the gaps"
  - **Follow-up**: "Create a new bead for the gaps and merge this as-is"
  - **Override**: "Merge anyway — user's decision"
- Update labels based on user choice:
  ```bash
  # If rework:
  bd label remove {BEAD_ID} approved
  bd label add {BEAD_ID} needs-rework

  # If follow-up or override:
  bd label add {BEAD_ID} qa-override
  ```

---

## Phase 5: Track QA Findings

After the verdict is resolved (regardless of PASS or FAIL), extract actionable findings from the QA comment and create tracked issues for anything that won't be addressed in the current cycle.

### When to run

- **PASS:** all non-positive findings (`[EXTRA]`, `[DEVIATES]`, `[RISK]`, unlogged deviations) are deferred — create issues for all of them
- **FAIL + rework:** `[BLOCKER]` and `[MAJOR]` failures will be addressed via `/start-task` rework, but `[MINOR]` failures, `[EXTRA]`, `[RISK]`, and unlogged deviations should still be tracked
- **FAIL + follow-up/override:** all non-positive findings should be tracked

### Process

1. Parse the QA comment for all findings that are NOT positive — i.e., anything that is not `[CONFORMS]`, `[PASS]`, or `[OK]`
2. Filter out findings that will be addressed in the current cycle (e.g., `[BLOCKER]` and `[MAJOR]` when user chose rework)
3. For remaining findings, resolve the project's **Review Findings epic**:
   - Search for an open epic titled "Review Findings": `bd list --type epic --status open --json` and filter by title
   - If not found, create it:
     ```bash
     bd create "Review Findings" --type epic --description "Persistent epic for tracking suggestions, warnings, and improvement opportunities identified during code reviews and QA that were not addressed in the current implementation cycle." --priority 3 --labels "findings"
     ```
   - Store the epic ID as `{FINDINGS_EPIC_ID}`
4. Dispatch **beads-owner** to create one issue per finding:
   ```python
   Task(
       subagent_type="beads-owner",
       prompt="Create beads issues for the following QA findings from BEAD {BEAD_ID} QA validation. Each issue should be created under parent {FINDINGS_EPIC_ID} with a discovered-from:{BEAD_ID} dependency. Use label 'finding:{type}' (lowercase) for each — e.g., finding:extra, finding:deviation, finding:risk, finding:minor. Include the relevant context from the QA report. Findings:\n\n{FINDINGS_LIST}"
   )
   ```
5. Inform the user how many finding issues were created and under which epic
