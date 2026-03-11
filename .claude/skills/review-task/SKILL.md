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
- If yes → proceed to Phase 5
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

## Phase 5: Dispatch Refactoring (Optional)

Only if verdict is `NEEDS-REFACTORING` and user approves:

```python
Task(
    subagent_type="refactoring-supervisor",
    prompt="Refactor BEAD {BEAD_ID}. Read the REVIEW comment in bead comments (bd comments {BEAD_ID}) for findings from the code-reviewer. Validate each finding before applying: check for false positives, cross-reference with existing beads for deferred work, and add TODO references for issues tracked in future tasks. Only fix validated real issues."
)
```
