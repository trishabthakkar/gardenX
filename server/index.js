'use strict';

/**
 * gardenX — Express API Server
 *
 * Endpoints
 *   GET  /api/graph              → nodes + edges for the visualizer
 *   GET  /api/search?q=          → full-text search across titles, content, and tags
 *   GET  /api/notes/:filename    → raw content + parsed metadata
 *   POST /api/notes/:filename    → write/create a note on disk (watcher rebuilds graph)
 *
 * Static client served from /client.
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const cors    = require('cors');

const { createWatcher } = require('./watcher');
const { parseNote }     = require('./parser');

const app       = express();
const PORT      = process.env.PORT || 3000;
const NOTES_DIR = path.resolve(__dirname, '../notes');

// Ensure /notes exists even on a fresh clone
fs.mkdirSync(NOTES_DIR, { recursive: true });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client')));

// ── Live graph store ──────────────────────────────────────────────────────────
const store = createWatcher(NOTES_DIR, ({ nodes, edges }, event, filePath) => {
  const name = filePath ? path.basename(filePath) : '?';
  console.log(`[watcher] ${event.padEnd(6)} "${name}" → ${nodes.length} nodes · ${edges.length} edges`);
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/search?q=<query>
 * Full-text search across note titles, raw content, and tags.
 * Returns an array of { filename, title, tags, matchIn, excerpt }.
 */
app.get('/api/search', (req, res) => {
  const q = ((req.query.q) ?? '').toLowerCase().trim();
  if (!q) return res.json([]);

  const { noteMap } = store.getGraph();
  const results = [];

  for (const [, note] of noteMap) {
    const raw       = (note.raw  ?? '').toLowerCase();
    const inTitle   = note.title.toLowerCase().includes(q);
    const inContent = raw.includes(q);
    const inTags    = (note.tags ?? []).some(t => t.toLowerCase().includes(q));

    if (!inTitle && !inContent && !inTags) continue;

    // Build a short context excerpt for content matches
    let excerpt = null;
    if (inContent) {
      const idx   = raw.indexOf(q);
      const start = Math.max(0, idx - 30);
      const end   = Math.min(note.raw.length, idx + q.length + 60);
      excerpt = (start > 0 ? '…' : '') +
                note.raw.slice(start, end).replace(/\n/g, ' ').trim() +
                (end < note.raw.length ? '…' : '');
    }

    results.push({
      filename: note.filename,
      title:    note.title,
      tags:     note.tags,
      matchIn:  [inTitle && 'title', inContent && 'content', inTags && 'tag'].filter(Boolean),
      excerpt,
    });
  }

  res.json(results);
});

/**
 * GET /api/graph
 * Full node+edge payload consumed by the D3 visualizer.
 */
app.get('/api/graph', (_req, res) => {
  const { nodes, edges } = store.getGraph();
  res.json({ nodes, edges });
});

/**
 * GET /api/notes/:filename
 * Returns raw Markdown + parsed metadata for a single note.
 * :filename may include or omit the .md extension.
 */
app.get('/api/notes/:filename', (req, res) => {
  const filename = req.params.filename.replace(/\.md$/, '');
  const { noteMap } = store.getGraph();
  const note = noteMap.get(filename);

  if (!note) {
    return res.status(404).json({ error: `Note "${filename}" not found` });
  }

  res.json({
    filename:  note.filename,
    title:     note.title,
    tags:      note.tags,
    links:     note.links,
    backlinks: note.backlinks,
    raw:       note.raw,
  });
});

/**
 * POST /api/notes/:filename
 * Body: { content: string }
 * Writes content to disk; the watcher automatically rebuilds the graph.
 */
app.post('/api/notes/:filename', (req, res) => {
  const filename = req.params.filename.replace(/\.md$/, '');
  const { content } = req.body;

  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'body.content must be a string' });
  }

  // Resolve and guard against path traversal
  const filePath = path.resolve(NOTES_DIR, `${filename}.md`);
  if (!filePath.startsWith(NOTES_DIR + path.sep)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  fs.writeFileSync(filePath, content, 'utf-8');

  const note = parseNote(filePath, content);
  res.json({ ok: true, filename: note.filename, title: note.title });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const { nodes, edges } = store.getGraph();
  console.log(`[gardenX] http://localhost:${PORT}`);
  console.log(`[gardenX] Boot graph → ${nodes.length} nodes · ${edges.length} edges`);
  console.log(`[gardenX] Watching ${NOTES_DIR}`);
});
