---
name: add-supervisor
description: Create a new implementation supervisor for a specific technology. Invokes the Discovery agent in on-demand mode to fetch, filter, and inject the beads workflow into a specialist agent. Use when adding a new tech stack to the project (e.g., new package in monorepo).
user_invocable: true
---

# Add Supervisor

Create an implementation supervisor for a technology that doesn't have one yet.

---

## Phase 1: Resolve Technology

If the user provides `$ARGUMENTS`, extract the technology name (e.g., `rust`, `react`, `python`, `go`, `flutter`).

**If technology provided:** use it directly.

**If no technology provided:**
1. List existing supervisors in `.claude/agents/` matching `*-supervisor.md`
2. Present what's already covered
3. Ask the user: "Which technology do you need a supervisor for?"

---

## Phase 2: Verify Supervisor Doesn't Exist

Check if a supervisor already exists for this technology:

1. Search `.claude/agents/` for files that match the technology name (e.g., `rust` → `rust-supervisor.md`, `python` → `python-backend-supervisor.md`)
2. **If supervisor already exists:**
   - Inform user: "A supervisor already exists for this technology: `{name}-supervisor.md`"
   - Ask: "Do you want to recreate it from scratch, or keep the existing one?"
   - If keep → stop
   - If recreate → proceed (Discovery will overwrite)
3. **If no supervisor exists** → proceed to Phase 3

---

## Phase 3: Dispatch Discovery

Dispatch the Discovery agent in **on-demand mode** to create a single supervisor:

```python
Task(
    subagent_type="discovery",
    prompt="Create a supervisor for {technology}. This is on-demand mode — do NOT scan the full codebase. Create only the {technology} supervisor by fetching the specialist from the external directory, filtering the content, injecting the beads workflow, and writing to .claude/agents/. Also update the Supervisors section in CLAUDE.md."
)
```

---

## Phase 4: Confirm

After Discovery completes:
1. Verify the new supervisor file exists in `.claude/agents/`
2. Inform user: "Created `{name}-supervisor.md`. You can now use it in beads tasks with `supervisor: {name}-supervisor` in the notes field."
