import type { Note, GraphNode, SearchResult } from '../types'
import NoteViewer from './NoteViewer'
import NoteEditor from './NoteEditor'

interface Props {
  note: Note | null
  graphNodes: GraphNode[]
  isEditing: boolean
  isSaving: boolean
  searchResults: SearchResult[] | null
  searchQuery: string
  onNavigate: (filename: string) => void
  onCreateNote: (filename: string) => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (filename: string, content: string) => Promise<void>
  onSelectSearchResult: (filename: string) => void
}

export default function Sidebar({
  note, graphNodes, isEditing, isSaving,
  searchResults, searchQuery,
  onNavigate, onCreateNote, onEdit, onCancelEdit, onSave,
  onSelectSearchResult,
}: Props) {
  // Search results overlay
  if (searchResults !== null) {
    return (
      <div className="flex flex-col h-full bg-[#0e1118]">
        <div className="px-4 py-3 border-b border-slate-800/70">
          <p className="text-xs text-slate-500">
            {searchResults.length === 0
              ? `No results for "${searchQuery}"`
              : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {searchResults.map(r => (
            <button
              key={r.filename}
              onClick={() => onSelectSearchResult(r.filename)}
              className="w-full text-left px-4 py-3 border-b border-slate-800/40 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm text-slate-200 font-medium">{r.title}</span>
                <div className="flex gap-1">
                  {r.matchIn.map(m => (
                    <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">{m}</span>
                  ))}
                </div>
              </div>
              {r.excerpt && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{r.excerpt}</p>
              )}
              {r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {r.tags.map(t => (
                    <span key={t} className="text-xs text-indigo-400">#{t}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 bg-[#0e1118]">
        <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800/30 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">Select a node to view its note</p>
        <p className="text-xs text-slate-700 mt-1">Or search to find notes quickly</p>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="flex flex-col h-full bg-[#0B0D12]">
        <NoteEditor
          filename={note.filename}
          initialContent={note.raw}
          onSave={onSave}
          onCancel={onCancelEdit}
          isSaving={isSaving}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0e1118]">
      <NoteViewer
        note={note}
        graphNodes={graphNodes}
        onNavigate={onNavigate}
        onCreateNote={onCreateNote}
        onEdit={onEdit}
      />
    </div>
  )
}
