---
name: start-task
description: Dynamic task routing — resolves bead ID, discovers the correct implementation supervisor from notes, runs codebase investigation if needed, and dispatches the supervisor with full context. Handles the complete orchestration cycle from task selection to supervisor dispatch.
user_invocable: true
---

# Start Task

Route a bead task through investigation and implementation. This is the orchestrator's main entry point for starting work on any bead.

---

## Phase 1: Resolve Bead ID

If the user provides `$ARGUMENTS`, check if it contains a bead ID (e.g., `bd-a3f`, `bd-001.2`).

**If bead ID provided:** use it directly.

**If no bead ID provided:**
1. Run `bd ready --json` to get unblocked tasks
2. Present the list to the user showing: ID, title, priority, and labels
3. Pick the task by order and priority, any doubt ask the user.

**Validate** the bead exists:
```bash
bd show {BEAD_ID} --json
```
If the bead does not exist, inform the user and stop.

---

## Phase 2: Read Full Bead Context

1. Parse the bead JSON output from Phase 1. Extract: `description`, `acceptance`, `design`, `notes`, `status`, `parent`, `labels`
2. **If bead is an epic child** (BEAD_ID contains a dot, e.g., `bd-001.2`):
   - Extract EPIC_ID: the part before the first dot (e.g., `bd-001`)
   - Read the epic: `bd show {EPIC_ID} --json`
   - Extract the design doc path from the epic if available
   - Read the design doc content — this is the implementation contract
3. Store all context for use in dispatch prompts

---

## Phase 3: Resolve Supervisor

1. Parse the `notes` field from the bead — look for a line matching `supervisor: {name}` (case-insensitive, trimmed)
2. **If `supervisor:` field found:**
   - Verify the agent file exists: check for `.claude/agents/{name}.md`
   - If file exists → supervisor resolved, proceed to Phase 4
   - If file NOT found → warn user that the specified supervisor does not exist, fall through to manual selection
3. **If `supervisor:` field NOT found** in notes, or the specified agent file does not exist:
   - List available implementation supervisors: find all `*-supervisor.md` files in `.claude/agents/`
   - Present the list to the user with agent names (without `.md` suffix)
   - Inform: "If the supervisor you need is not listed, you can create one with `/add-supervisor {technology}`."
   - Ask: "Which supervisor should handle this task? Or do you need to create a new one first?"
   - If user wants to create → stop and suggest running `/add-supervisor {tech}` first, then re-run `/start-task`
   - If user selects existing → supervisor resolved

---

## Phase 4: Investigation Check

1. Read bead comments: `bd comments {BEAD_ID}`
2. Search the comments for one containing the string `INVESTIGATION:`
3. **If no investigation found:**
   - Inform user: "No investigation found for this bead. I can dispatch the research agent to investigate first."
   - Ask user: "Do you want to proceed with investigation, or skip and dispatch directly to the supervisor?"
   - **If user wants investigation** → dispatch research agent:
     ```python
     Task(
         subagent_type="research",
         prompt="Investigate BEAD {BEAD_ID}. [Include EPIC_ID if epic child]. Read the bead (bd show {BEAD_ID}) for full context — description, acceptance criteria, and design notes. Log your structured findings as a bead comment using bd comments add."
     )
     ```
   - Wait for the research agent to complete before proceeding to Phase 5
   - **If user wants to skip** → proceed directly to Phase 5
4. **If investigation already exists** → proceed directly to Phase 5

---

## Phase 5: Check for Existing Branch

Before dispatching, check if a branch already exists for this bead (e.g., from a previous NEEDS-REWORK cycle):

```bash
git branch -a | grep {BEAD_ID}
```

**If branch exists:**
- Inform user: "A branch already exists for this bead: `{branch-name}`. This may be from a previous implementation attempt."
- Ask user: "Do you want to continue on the existing branch, or create a fresh branch?"
- Include this context in the dispatch prompt so the supervisor knows whether to checkout the existing branch or create new

**If no branch exists:** proceed normally.

---

## Phase 6: Dispatch Implementation Supervisor

1. Build the dispatch prompt with complete context:
   - BEAD_ID (and EPIC_ID if this is an epic child)
   - Full description and acceptance criteria
   - Design notes
   - Reference to investigation: "Read bead comments (bd comments {BEAD_ID}) for investigation context before starting implementation."
   - Epic design doc reference if applicable

2. Dispatch the resolved supervisor:
   ```python
   Task(
       subagent_type="{resolved-supervisor}",
       prompt="Implement BEAD {BEAD_ID}. [Include EPIC_ID if epic child]. Read the bead (bd show {BEAD_ID}) and comments (bd comments {BEAD_ID}) for full context — description, acceptance criteria, design notes, and investigation findings."
   )
   ```

3. The `PreToolUse` hook automatically injects the discipline reminder because the agent name ends in `-supervisor`.
