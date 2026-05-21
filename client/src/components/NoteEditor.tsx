import { useState, useEffect } from 'react'

interface Props {
  filename: string
  initialContent: string
  onSave: (filename: string, content: string) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}

export default function NoteEditor({ filename, initialContent, onSave, onCancel, isSaving }: Props) {
  const [content, setContent] = useState(initialContent)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setContent(initialContent)
    setHasChanges(false)
  }, [filename, initialContent])

  useEffect(() => {
    setHasChanges(content !== initialContent)
  }, [content, initialContent])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges) onSave(filename, content)
      }
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [filename, content, hasChanges, onSave, onCancel])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/70 shrink-0">
        <span className="text-xs text-slate-500 font-mono">{filename}.md</span>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-500">unsaved changes</span>
          )}
          <button
            onClick={onCancel}
            className="px-2.5 py-1 text-xs rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(filename, content)}
            disabled={!hasChanges || isSaving}
            className="px-3 py-1 text-xs rounded bg-emerald-800/60 text-emerald-200 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-emerald-700/40"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        spellCheck={false}
        className="
          flex-1 w-full p-4 resize-none outline-none
          bg-[#0B0D12] text-slate-300 font-mono text-sm leading-relaxed
          placeholder-slate-700
        "
        placeholder="# Note title&#10;&#10;Start writing…"
      />
    </div>
  )
}
