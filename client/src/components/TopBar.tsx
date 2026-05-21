import SearchBar from './SearchBar'

interface Props {
  searchQuery: string
  onSearchChange: (v: string) => void
  onSearchClear: () => void
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  nodeCount: number
  edgeCount: number
}

export default function TopBar({
  searchQuery, onSearchChange, onSearchClear,
  canGoBack, canGoForward, onBack, onForward,
  nodeCount, edgeCount,
}: Props) {
  return (
    <header className="flex items-center justify-between px-4 h-11 bg-[#0e1118] border-b border-slate-800/70 shrink-0 z-10">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-semibold tracking-tight text-sm">garden</span>
          <span className="text-emerald-600 font-semibold tracking-tight text-sm">X</span>
        </div>
        {/* Nav buttons */}
        <div className="flex items-center gap-0.5 ml-2">
          <button
            onClick={onBack}
            disabled={!canGoBack}
            title="Back (Alt+←)"
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onForward}
            disabled={!canGoForward}
            title="Forward (Alt+→)"
            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <SearchBar value={searchQuery} onChange={onSearchChange} onClear={onSearchClear} />

      <div className="text-xs text-slate-600 tabular-nums">
        {nodeCount} nodes · {edgeCount} edges
      </div>
    </header>
  )
}
