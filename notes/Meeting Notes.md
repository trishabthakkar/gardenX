# Meeting Notes

Session records and key decisions.

## 2024-01-15 — Kickoff

Reviewed scope for [[Project Ideas]].
Agreed that [[Research]] on knowledge graph systems informed the architecture.

Key decisions made:

1. Node.js + Express for the server layer
2. Markdown files are the source of truth — no external database
3. [[Index]] acts as the canonical entry point for navigation
4. Parser must handle bidirectional links in two passes

## 2024-01-22 — Architecture Review

Confirmed separation of concerns:
- `/server` — Express API + MDD parser + chokidar watcher
- `/client` — D3 visualizer (static HTML, no build step)
- `/notes` — the "database"

Next session: review [[Research]] findings on graph layout algorithms.

#meeting #planning #cs180 #decisions
