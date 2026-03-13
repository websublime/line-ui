#!/bin/bash
#
# SessionStart: Show full task context for orchestrator
#

BEADS_DIR="$CLAUDE_PROJECT_DIR/.beads"

if [[ ! -d "$BEADS_DIR" ]]; then
  echo "No .beads directory found. Run 'bd init' to initialize."
  exit 0
fi

# Check if bd is available
if ! command -v bd &>/dev/null; then
  echo "beads CLI (bd) not found. Install from: https://github.com/steveyegge/beads"
  exit 0
fi

# ============================================================
# Dirty Parent Check - Warn if main directory has uncommitted changes
# ============================================================
REPO_ROOT=$(git -C "$CLAUDE_PROJECT_DIR" rev-parse --show-toplevel 2>/dev/null)
if [[ -n "$REPO_ROOT" ]]; then
  DIRTY=$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null)
  if [[ -n "$DIRTY" ]]; then
    echo "⚠️  WARNING: Main directory has uncommitted changes."
    echo "   Agents should only work in .worktrees/"
    echo ""
  fi
fi

# ============================================================
# Plugin Version Check - Notify if update available
# ============================================================
VERSION_FILE="$CLAUDE_PROJECT_DIR/.claude/.mister-anderson-version"
if [[ -f "$VERSION_FILE" ]]; then
  LOCAL_VERSION=$(cat "$VERSION_FILE" 2>/dev/null | tr -d '[:space:]')
  REMOTE_VERSION=$(curl -sf --max-time 3 \
    https://raw.githubusercontent.com/websublime/mister-anderson/main/.claude-plugin/plugin.json \
    2>/dev/null | grep '"version"' | head -1 | sed 's/[^0-9.]//g')

  if [[ -n "$REMOTE_VERSION" && "$REMOTE_VERSION" != "$LOCAL_VERSION" ]]; then
    echo "⬆️  mister-anderson update available: $LOCAL_VERSION → $REMOTE_VERSION"
    echo "   Run /update-plugin to update."
    echo ""
  fi
fi

echo ""
echo "## Task Status"
echo ""

# Show in-progress beads first (highest priority)
IN_PROGRESS=$(bd list --status in_progress 2>/dev/null | head -5)
if [[ -n "$IN_PROGRESS" ]]; then
  echo "### In Progress (resume these):"
  echo "$IN_PROGRESS"
  echo ""
fi

# Show ready (unblocked) beads
READY=$(bd ready 2>/dev/null | head -5)
if [[ -n "$READY" ]]; then
  echo "### Ready (no blockers):"
  echo "$READY"
  echo ""
fi

# Show blocked beads
BLOCKED=$(bd blocked 2>/dev/null | head -3)
if [[ -n "$BLOCKED" ]]; then
  echo "### Blocked:"
  echo "$BLOCKED"
  echo ""
fi

# Show stale beads (no activity in 3 days)
STALE=$(bd stale --days 3 2>/dev/null | head -3)
if [[ -n "$STALE" ]]; then
  echo "### Stale (no activity in 3 days):"
  echo "$STALE"
  echo ""
fi

# Show beads with specific labels
LABELS=("needs-review" "needs-tests" "needs-docs")
for label in "${LABELS[@]}"; do
  LABELED=$(bd list --label "$label" 2>/dev/null | head -5)
  if [[ -n "$LABELED" ]]; then
    echo "### Label: $label"
    echo "$LABELED"
    echo ""
  fi
done

# If nothing found
if [[ -z "$IN_PROGRESS" && -z "$READY" && -z "$BLOCKED" && -z "$STALE" ]]; then
  echo "No active beads. Create one with: bd create \"Task title\" -d \"Description\""
fi
