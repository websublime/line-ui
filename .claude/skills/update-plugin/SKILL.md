---
name: update-plugin
description: Update mister-anderson plugin files to the latest version without losing user customizations.
user-invocable: true
---

# Update Plugin

Update mister-anderson core files (agents, skills, hooks) to the latest version while preserving user customizations.

---

## What Gets Updated vs Preserved

### Updated (overwritten with latest)
- **Core agents** (`architect.md`, `product-manager.md`, `research.md`, `discovery.md`, `code-reviewer.md`, `qa-gate.md`, `refactoring-supervisor.md`, `beads-owner.md`)
- **Skills** (all directories under `.claude/skills/`)
- **Hooks** (`hooks.json`, `session-start.sh`, `inject-discipline-reminder.sh`)

### Preserved (never touched)
- **CLAUDE.md** — project-specific orchestrator config
- **AGENTS.md** — project-specific workflow docs
- **BEADS-WORKFLOW.md** — project-specific workflow docs
- **Dynamic supervisors** — any `*-supervisor.md` agents **except** `refactoring-supervisor.md` (which is a core agent)
- **Beads database** (`.beads/`)
- **Project settings** (`.claude/settings.json`, `.claude/settings.local.json`)

---

## Phase 1: Version Check

Compare installed version with the plugin source version.

```bash
LOCAL_VERSION=$(cat .claude/.mister-anderson-version 2>/dev/null | tr -d '[:space:]')
echo "Installed version: ${LOCAL_VERSION:-unknown}"
```

Read the plugin source `plugin.json` to get the available version:
```bash
# The plugin source plugin.json has the latest version
cat <PLUGIN_SOURCE_DIR>/.claude-plugin/plugin.json
```

> The plugin source directory is where this skill file lives — resolve relative to this SKILL.md's location (go up two levels from `skills/update-plugin/`).

**If versions match:** Inform user they are already up to date. Stop.

**If local version is unknown:** Warn that this project may not have been set up with `/setup-project`. Ask user if they want to proceed anyway.

---

## Phase 2: Diff Preview

Before applying any changes, show the user what will be updated.

1. **List core agents** that will be overwritten:
   ```bash
   ls .claude/agents/{architect,product-manager,research,discovery,code-reviewer,qa-gate,refactoring-supervisor,beads-owner}.md 2>/dev/null
   ```

2. **List skills** that will be overwritten:
   ```bash
   ls -d .claude/skills/*/ 2>/dev/null
   ```

3. **List dynamic supervisors** that will be PRESERVED:
   ```bash
   # All *-supervisor.md EXCEPT refactoring-supervisor.md
   ls .claude/agents/*-supervisor.md 2>/dev/null | grep -v refactoring-supervisor.md
   ```

4. **List hooks** that will be updated:
   ```bash
   ls .claude/hooks/ 2>/dev/null
   ```

5. **Show new/removed files** — compare skill directories between source and installed:
   ```bash
   # New skills in source not in installed
   diff <(ls <PLUGIN_SOURCE_DIR>/skills/) <(ls .claude/skills/) 2>/dev/null
   ```

Present a summary:
```
Update mister-anderson: {LOCAL_VERSION} → {NEW_VERSION}

Will UPDATE:
  - 8 core agents
  - {N} skills
  - Hook scripts

Will PRESERVE:
  - CLAUDE.md, AGENTS.md, BEADS-WORKFLOW.md
  - {N} dynamic supervisors: {list names}
  - .beads/ database
  - Project settings

New in this version:
  - {list any new skills or agents}

Removed in this version:
  - {list any removed skills or agents}
```

**Ask user for confirmation before proceeding.**

---

## Phase 3: Apply Update

After user confirms:

### 3.1 Update core agents
```bash
PLUGIN_SRC="<PLUGIN_SOURCE_DIR>"
CORE_AGENTS=(architect product-manager research discovery code-reviewer qa-gate refactoring-supervisor beads-owner)
for agent in "${CORE_AGENTS[@]}"; do
  cp "$PLUGIN_SRC/agents/${agent}.md" ./.claude/agents/
done
```

### 3.2 Update skills
```bash
# Remove old skills (except setup-project if it was already removed)
# Then copy fresh from source
rm -rf ./.claude/skills/add-supervisor
rm -rf ./.claude/skills/architect-solution
rm -rf ./.claude/skills/beads-product-owner
rm -rf ./.claude/skills/create-bead-issues
rm -rf ./.claude/skills/migrate-beads
rm -rf ./.claude/skills/product-requirements
rm -rf ./.claude/skills/qa-task
rm -rf ./.claude/skills/review-task
rm -rf ./.claude/skills/start-task
rm -rf ./.claude/skills/subagents-discipline
rm -rf ./.claude/skills/update-plugin

cp -r "$PLUGIN_SRC/skills/"* ./.claude/skills/
```

> **Note:** The `setup-project` skill is only copied if it doesn't already exist (it may have been removed in Step 8 of setup). If user previously removed it, respect that choice:
> ```bash
> if [[ ! -d "./.claude/skills/setup-project" ]]; then
>   rm -rf ./.claude/skills/setup-project
> fi
> ```

### 3.3 Update hooks
```bash
cp "$PLUGIN_SRC/hooks/hooks.json" ./.claude/hooks/
cp "$PLUGIN_SRC/hooks/session-start.sh" ./.claude/hooks/
cp "$PLUGIN_SRC/hooks/inject-discipline-reminder.sh" ./.claude/hooks/
```

### 3.4 Update version file
```bash
echo "{NEW_VERSION}" > ./.claude/.mister-anderson-version
```

---

## Phase 4: Post-Update Verification

1. **Verify files were copied:**
   ```bash
   ls .claude/agents/{architect,product-manager,research,discovery,code-reviewer,qa-gate,refactoring-supervisor,beads-owner}.md
   ls .claude/hooks/{hooks.json,session-start.sh,inject-discipline-reminder.sh}
   cat .claude/.mister-anderson-version
   ```

2. **Check dynamic supervisors are intact:**
   ```bash
   ls .claude/agents/*-supervisor.md | grep -v refactoring-supervisor.md
   ```

3. **Report result:**
   ```
   ✅ mister-anderson updated to {NEW_VERSION}

   Updated: 8 core agents, {N} skills, hook scripts
   Preserved: {N} dynamic supervisors, CLAUDE.md, AGENTS.md

   Tip: If your tech stack changed, run /add-supervisor to create new supervisors.
   ```

---

## Phase 5: Optional — Re-run Discovery

If the new version includes changes to supervisor templates or the discovery agent, offer:

> "The discovery agent template was updated in this version. Do you want to re-run discovery to refresh your dynamic supervisors? This will NOT delete existing ones — only create missing ones or update the template."

**If user agrees:**
```python
Task(
    subagent_type="discovery",
    prompt="Detect tech stack and create/update supervisors for this project. Do NOT delete existing supervisors."
)
```

**If user declines:** no action needed.
