# gardenX

A personal knowledge graph built on plain Markdown files. Drop `.md` notes into `/notes`, wiki-link between them with `[[Note Name]]`, and watch an interactive force-directed graph build itself in real time.

## Features

- **Markdown-driven** — raw `.md` files are the only database; no SQL, no ORM
- **Wiki-links** — `[[Note Name]]` syntax with automatic bidirectional backlinks
- **Live graph** — chokidar watches `/notes` and rebuilds the graph on every save
- **D3 force layout** — node size reflects backlink count; positions are preserved across updates
- **Full-text search** — searches titles, body content, and tags via `/api/search`
- **Tag filtering** — prefix search with `#` to filter by tag
- **Note editor** — create and edit notes in-browser; `Cmd+S` to save, `Escape` to cancel
- **Navigation history** — `Alt+←` / `Alt+→` to move back and forward between visited notes
- **Broken-link creation** — clicking an unresolved `[[Link]]` creates the note and opens it for editing

## Tech stack

| Layer | Technology |
|---|---|
| Server | Node.js · Express · chokidar |
| Parser | Custom two-pass RegExp engine (no AST library) |
| Client | React 19 · TypeScript · Vite |
| Graph | D3 v7 force simulation |
| Styling | Tailwind CSS v4 |
| Markdown | marked v9 with a custom wiki-link inline extension |

## Project structure

```
gardenX/
├── notes/              ← your Markdown files (the "database")
├── server/
│   ├── index.js        ← Express API (ports 5001)
│   ├── parser.js       ← two-pass MDD parser
│   └── watcher.js      ← chokidar file watcher
└── client/
    ├── src/
    │   ├── types.ts
    │   ├── App.tsx
    │   ├── hooks/
    │   │   └── useNavHistory.ts
    │   └── components/
    │       ├── GraphVisualizer.tsx
    │       ├── NoteViewer.tsx
    │       ├── NoteEditor.tsx
    │       ├── Sidebar.tsx
    │       ├── SearchBar.tsx
    │       └── TopBar.tsx
    ├── vite.config.ts
    └── package.json
```

## Getting started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
# Server dependencies (root)
npm install

# Client dependencies
cd client && npm install
```

### Run in development

Open two terminals:

```bash
# Terminal 1 — Express API (port 5001)
npm run dev

# Terminal 2 — Vite dev server (port 5173, proxies /api → 5001)
cd client && npm run dev
```

Then open `http://localhost:5173`.

### Production build

```bash
cd client && npm run build
```

The built assets land in `client/dist/`. The Express server already serves `../client` as static files, so you can run just:

```bash
npm start
```

and visit `http://localhost:5001`.

## Writing notes

Notes are standard Markdown files in `/notes`.

```markdown
# My Note

Link to another note with [[Note Name]].
Tag with #mytag anywhere outside a heading.

## Section

More content here.
```

**Supported syntax:**

| Syntax | Effect |
|---|---|
| `# Title` | Sets the note title (first H1) |
| `[[Note Name]]` | Creates a navigable wiki-link; backlink auto-added to target |
| `#tag` | Tags the note (not inside headings) |

Notes are parsed in two passes: the first extracts titles, links, and tags from every file; the second walks the adjacency list to back-propagate `backlinks` onto target notes.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/graph` | All nodes and edges for the visualizer |
| `GET` | `/api/notes/:filename` | Raw content + metadata for one note |
| `POST` | `/api/notes/:filename` | Write or create a note (`{ content: string }`) |
| `GET` | `/api/search?q=` | Full-text search across titles, content, and tags |

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Focus search bar |
| `Escape` | Clear search / cancel edit |
| `Alt+←` | Navigate back |
| `Alt+→` | Navigate forward |
| `Cmd+S` | Save note (while editing) |
