import { useState, useEffect, useCallback, useRef } from 'react'
import type { GraphData, GraphNode, Note, SearchResult } from './types'
import { useNavHistory } from './hooks/useNavHistory'
import TopBar from './components/TopBar'
import GraphVisualizer from './components/GraphVisualizer'
import Sidebar from './components/Sidebar'

const SEARCH_DEBOUNCE_MS = 250

export default function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nav = useNavHistory()

  // ── Graph loading ──────────────────────────────────────────────────────
  const loadGraph = useCallback(async (preserveSelection = false) => {
    try {
      const res = await fetch('/api/graph')
      const data: GraphData = await res.json()
      setGraphData(data)
      if (!preserveSelection) setSelectedNote(null)
    } catch (err) {
      console.error('Failed to load graph', err)
    }
  }, [])

  useEffect(() => { loadGraph() }, [loadGraph])

  // ── Note loading ──────────────────────────────────────────────────────
  const loadNote = useCallback(async (filename: string) => {
    try {
      const res = await fetch(`/api/notes/${encodeURIComponent(filename)}`)
      if (!res.ok) return
      const note: Note = await res.json()
      setSelectedNote(note)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to load note', err)
    }
  }, [])

  // ── Navigation ────────────────────────────────────────────────────────
  const selectNote = useCallback((filename: string) => {
    nav.push(filename)
    loadNote(filename)
    setSearchResults(null)
    setSearchQuery('')
  }, [nav, loadNote])

  const selectNoteInternal = useCallback((filename: string) => {
    loadNote(filename)
  }, [loadNote])

  const handleBack = useCallback(() => {
    if (!nav.canGoBack) return
    nav.back()
  }, [nav])

  const handleForward = useCallback(() => {
    if (!nav.canGoForward) return
    nav.forward()
  }, [nav])

  // Watch history index changes to trigger note load
  const prevIdxRef = useRef(nav.state.idx)
  useEffect(() => {
    if (nav.state.idx === prevIdxRef.current) return
    prevIdxRef.current = nav.state.idx
    const target = nav.current
    if (target) selectNoteInternal(target)
  }, [nav.state.idx, nav.current, selectNoteInternal])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft')  { e.preventDefault(); handleBack() }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); handleForward() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleBack, handleForward])

  // ── Create note ───────────────────────────────────────────────────────
  const createNote = useCallback(async (filename: string) => {
    const template = `# ${filename}\n\n`
    try {
      await fetch(`/api/notes/${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: template }),
      })
      await loadGraph(true)
      selectNote(filename)
      setIsEditing(true)
    } catch (err) {
      console.error('Failed to create note', err)
    }
  }, [loadGraph, selectNote])

  // ── Save note ─────────────────────────────────────────────────────────
  const saveNote = useCallback(async (filename: string, content: string) => {
    setIsSaving(true)
    try {
      await fetch(`/api/notes/${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      await loadGraph(true)
      await loadNote(filename)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save note', err)
    } finally {
      setIsSaving(false)
    }
  }, [loadGraph, loadNote])

  // ── Search ────────────────────────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (!q) { setSearchResults(null); return }

    if (q.startsWith('#')) {
      const tag = q.slice(1).toLowerCase()
      const hits: SearchResult[] = graphData.nodes
        .filter(n => n.tags.some(t => t.toLowerCase().includes(tag)))
        .map(n => ({
          filename: n.id,
          title: n.title,
          tags: n.tags,
          matchIn: ['tag'],
          excerpt: null,
        }))
      setSearchResults(hits)
      return
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const results: SearchResult[] = await res.json()
      setSearchResults(results)
    } catch (err) {
      console.error('Search failed', err)
    }
  }, [graphData.nodes])

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!q) { setSearchResults(null); return }
    searchTimerRef.current = setTimeout(() => runSearch(q), SEARCH_DEBOUNCE_MS)
  }, [runSearch])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    setSearchResults(null)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
  }, [])

  const filterHits: Set<string> | null = searchResults
    ? new Set(searchResults.map(r => r.filename))
    : null

  return (
    <div className="flex flex-col h-screen bg-[#0B0D12] overflow-hidden">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        canGoBack={nav.canGoBack}
        canGoForward={nav.canGoForward}
        onBack={handleBack}
        onForward={handleForward}
        nodeCount={graphData.nodes.length}
        edgeCount={graphData.edges.length}
      />

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 relative">
          <GraphVisualizer
            data={graphData}
            selectedId={selectedNote?.filename ?? null}
            filterHits={filterHits}
            onSelect={selectNote}
          />
          {graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-slate-600 text-sm">No notes yet.</p>
              <p className="text-slate-700 text-xs mt-1">
                Add <code className="font-mono">.md</code> files to <code className="font-mono">/notes</code>
              </p>
            </div>
          )}
        </div>

        <div className="w-[380px] shrink-0 border-l border-slate-800/70 flex flex-col min-h-0">
          <Sidebar
            note={selectedNote}
            graphNodes={graphData.nodes as GraphNode[]}
            isEditing={isEditing}
            isSaving={isSaving}
            searchResults={searchResults}
            searchQuery={searchQuery}
            onNavigate={selectNote}
            onCreateNote={createNote}
            onEdit={() => setIsEditing(true)}
            onCancelEdit={() => setIsEditing(false)}
            onSave={saveNote}
            onSelectSearchResult={selectNote}
          />
        </div>
      </div>
    </div>
  )
}
