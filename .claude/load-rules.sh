#!/bin/bash
# Load project rules at session start

if [ -f "$CLAUDE_PROJECT_DIR/.claude/project-rules.md" ]; then
  echo "📋 === PROJECT RULES (AUTO-LOADED) ==="
  echo ""
  cat "$CLAUDE_PROJECT_DIR/.claude/project-rules.md"
  echo ""
  echo "=== END OF PROJECT RULES ==="
fi
