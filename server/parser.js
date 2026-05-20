'use strict';

/**
 * gardenX MDD Engine
 *
 * Lightweight custom parser — no external AST library.
 * Two-pass algorithm:
 *   Pass 1 — scan every .md file and extract title / wiki-links / tags.
 *   Pass 2 — walk the link adjacency list to compute backlinks for every node.
 */

const fs   = require('fs');
const path = require('path');

// ── Compiled regexes ──────────────────────────────────────────────────────────

// First H1 heading in the document
const RE_TITLE     = /^#\s+(.+)$/m;

// [[Target Name]] — wiki-link syntax
const RE_WIKI_LINK = /\[\[([^\]]+)\]\]/g;

// #word inside body text (line-level heading detection done separately)
const RE_TAG       = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;

// Lines that ARE headings (# … through ###### …) — skipped during tag scan
const RE_HEADING   = /^#{1,6}\s/;

// ── Single-file parser ────────────────────────────────────────────────────────

/**
 * Parse one Markdown file's raw content into structured metadata.
 *
 * @param {string} filePath  Absolute path to the .md file
 * @param {string} content   Raw UTF-8 content of the file
 * @returns {{ filename, title, links, tags, backlinks, raw }}
 */
function parseNote(filePath, content) {
  const filename = path.basename(filePath, '.md');

  // ── Title: first H1 ─────────────────────────────────────────────────────────
  const titleMatch = RE_TITLE.exec(content);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  // ── Wiki-links: [[Target]] ───────────────────────────────────────────────────
  const links = [];
  const wikiRe = new RegExp(RE_WIKI_LINK.source, 'g');
  let m;
  while ((m = wikiRe.exec(content)) !== null) {
    const target = m[1].trim();
    if (!links.includes(target)) links.push(target);
  }

  // ── Tags: #word (heading lines excluded) ────────────────────────────────────
  const tags = [];
  const tagRe = new RegExp(RE_TAG.source, 'g');
  for (const line of content.split('\n')) {
    if (RE_HEADING.test(line)) continue;   // skip heading lines
    tagRe.lastIndex = 0;                   // reset stateful regex per line
    while ((m = tagRe.exec(line)) !== null) {
      if (!tags.includes(m[1])) tags.push(m[1]);
    }
  }

  return { filename, title, links, tags, backlinks: [], raw: content };
}

// ── Full-graph builder ────────────────────────────────────────────────────────

/**
 * Scan notesDir, parse every .md file, then build the bidirectional
 * relationship matrix.
 *
 * @param {string} notesDir  Absolute path to the notes folder
 * @returns {{ nodes: object[], edges: object[], noteMap: Map<string, object> }}
 */
function buildGraph(notesDir) {
  // ── Pass 1: parse every note ─────────────────────────────────────────────────
  let files = [];
  try {
    files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
  } catch {
    // notes dir may not exist yet on first boot
  }

  /** @type {Map<string, ReturnType<parseNote>>} */
  const noteMap = new Map();

  for (const file of files) {
    const filePath = path.join(notesDir, file);
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }
    const note = parseNote(filePath, content);
    noteMap.set(note.filename, note);
  }

  // ── Pass 2: compute backlinks (bidirectional matrix) ─────────────────────────
  for (const [, note] of noteMap) {
    for (const link of note.links) {
      const target = noteMap.get(link);
      if (target && !target.backlinks.includes(note.filename)) {
        target.backlinks.push(note.filename);
      }
    }
  }

  // ── Assemble graph payload ───────────────────────────────────────────────────
  const nodes = [];
  const edges = [];

  for (const [, note] of noteMap) {
    nodes.push({
      id:        note.filename,
      title:     note.title,
      tags:      note.tags,
      backlinks: note.backlinks,
    });

    for (const link of note.links) {
      if (noteMap.has(link)) {
        edges.push({ source: note.filename, target: link });
      }
    }
  }

  return { nodes, edges, noteMap };
}

module.exports = { parseNote, buildGraph };
