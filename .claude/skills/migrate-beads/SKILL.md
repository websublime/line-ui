---
name: migrate-beads
description: Migrate existing beads issues to match updated field conventions. Reads all open beads, detects fields that need moving (e.g., supervisor from notes to assignee), previews changes, and applies with user confirmation.
user_invocable: true
---

# Migrate Beads

Bulk-update existing beads to align with current field conventions. Run this after updating the plugin when field mappings change.

---

## Phase 1: Discover Migration Targets

1. Fetch all open beads:
   ```bash
   bd list --status open --json
   ```
   Also include `in_progress` and `in-review`:
   ```bash
   bd list --status in_progress --json
   bd list --status in-review --json
   ```

2. For each bead, read full details:
   ```bash
   bd show {BEAD_ID} --json
   ```

3. Analyze each bead against the **migration rules** below. Collect a list of beads that need changes.

---

## Phase 2: Migration Rules

Apply these rules to each bead. Only flag a bead if at least one rule matches.

### Rule 1: Supervisor in notes → assignee

**Detect:** The `notes` field contains a line matching `supervisor: {name}` (case-insensitive) AND the `assignee` field is empty or does not match.

**Action:**
- Extract the supervisor name from notes
- Verify the agent file exists: `.claude/agents/{name}.md`
- Set `--assignee {name}`
- Rewrite `--notes` without the `supervisor:` line (preserve all other content)

### Rule 2: Reference in notes → spec-id / external-ref

**Detect:** The `notes` field contains a line matching `Reference: {value}` (case-insensitive).

**Action:**
- Parse the reference value (may contain multiple refs comma-separated, e.g., `PRD 9.14, ARCH 6`)
- First reference that contains "PRD" → set `--spec-id` (if spec-id is currently empty)
- Remaining references → combine pipe-separated into `--external-ref` (if external-ref is currently empty)
- Rewrite `--notes` without the `Reference:` line

### Rule 3: Task ID in notes → remove

**Detect:** The `notes` field contains a line matching `Task ID: {value}` AND the bead title already contains the same task ID.

**Action:**
- Remove the `Task ID:` line from notes (it's redundant with the title)

### Rule 4: Complexity in notes → remove

**Detect:** The `notes` field contains a line matching `Complexity: {value}`.

**Action:**
- Remove the `Complexity:` line from notes (optional field, not mapped to a dedicated field)

---

## Phase 3: Preview Changes (Dry Run)

Present a summary table to the user:

```
Migration Preview — {N} beads to update

{BEAD_ID}: {title}
  ├─ assignee: (empty) → rust-supervisor
  ├─ spec-id: (empty) → PRD 9.14
  ├─ external-ref: (empty) → ARCH 6
  └─ notes: cleaned (removed: supervisor, Reference, Task ID, Complexity lines)

{BEAD_ID}: {title}
  └─ assignee: (empty) → react-supervisor
  ...

{M} beads already up to date — no changes needed.
```

Ask the user: **"Apply these changes? (yes / no / select specific beads)"**

---

## Phase 4: Apply Changes

**If user confirms all:**
- For each bead, run `bd update` with the computed flags
- Notes field: rewrite the full notes content minus the extracted lines

**If user wants to select:**
- Let user pick which beads to update by ID
- Apply only selected

**For each bead update:**
```bash
bd update {BEAD_ID} --assignee "{supervisor}" --spec-id "{prd_ref}" --external-ref "{other_refs}" --notes "{cleaned_notes}"
```

Only include flags for fields that actually changed. Do NOT set a flag if the value didn't change.

After all updates, show a summary:
```
Migration complete: {N} beads updated, {M} skipped.
```

---

## Adding Future Migration Rules

When field conventions change again, add new rules to Phase 2 following the same pattern:

1. **Detect** — How to identify beads that need this change
2. **Action** — What fields to set/move/clean

The existing rules can be left in place (they're idempotent — a bead that already has assignee set won't be flagged again). Over time, old rules become no-ops naturally.
