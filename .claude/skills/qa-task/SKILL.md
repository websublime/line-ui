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
