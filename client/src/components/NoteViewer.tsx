import { useEffect, useRef, useMemo } from 'react'
import { Marked } from 'marked'
import type { Note, GraphNode } from '../types'

interface Props {
  note: Note
  graphNodes: GraphNode[]
  onNavigate: (filename: string) => void
  onCreateNote: (filename: string) => void
  onEdit: () => void
}

function buildMarked(existingIds: Set<string>): Marked {
  const marked = new Marked()

  marked.use({
    extensions: [{
      name: 'wikiLink',
      level: 'inline',
      start: (src: string) => src.indexOf('[['),
      tokenizer(src: string) {
        const match = /^\[\[([^\]]+)\]\]/.exec(src)
        if (match) {
          return { type: 'wikiLink', raw: match[0], target: match[1].trim() }
        }
      },
      renderer(token) {
        const t = token as unknown as { target: string }
        const exists = existingIds.has(t.target)
        const cls = exists ? 'wiki-link' : 'wiki-link broken'
        return `<button class="${cls}" data-wiki="${encodeURIComponent(t.target)}">${t.target}</button>`
      },
    }],
  })

  return marked
}

function linkifyTags(container: HTMLElement, onTag: (tag: string) => void) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName
      if (['CODE', 'PRE', 'BUTTON', 'SCRIPT'].includes(tag)) return NodeFilter.FILTER_REJECT
      return /(?:^|\s)#[a-zA-Z][a-zA-Z0-9_-]*/.test(node.textContent ?? '')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
    },
  })

  const nodesToProcess: Text[] = []
  let current = walker.nextNode()
  while (current) {
    nodesToProcess.push(current as Text)
    current = walker.nextNode()
  }

  for (const textNode of nodesToProcess) {
    const parts = textNode.textContent!.split(/((?:^|\s)#[a-zA-Z][a-zA-Z0-9_-]*)/)
    if (parts.length <= 1) continue
    const frag = document.createDocumentFragment()
    for (const part of parts) {
      const tagMatch = part.match(/^(\s*)(#[a-zA-Z][a-zA-Z0-9_-]*)$/)
      if (tagMatch) {
        if (tagMatch[1]) frag.appendChild(document.createTextNode(tagMatch[1]))
        const btn = document.createElement('button')
        btn.className = 'tag-link'
        btn.textContent = tagMatch[2]
        btn.dataset.tag = tagMatch[2].slice(1)
        btn.addEventListener('click', () => onTag(tagMatch[2].slice(1)))
        frag.appendChild(btn)
      } else {
        frag.appendChild(document.createTextNode(part))
      }
    }
    textNode.parentNode!.replaceChild(frag, textNode)
  }
}

export default function NoteViewer({ note, graphNodes, onNavigate, onCreateNote, onEdit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onNavigateRef = useRef(onNavigate)
  const onCreateNoteRef = useRef(onCreateNote)

  useEffect(() => { onNavigateRef.current = onNavigate }, [onNavigate])
  useEffect(() => { onCreateNoteRef.current = onCreateNote }, [onCreateNote])

  const existingIds = useMemo(
    () => new Set(graphNodes.map(n => n.id)),
    [graphNodes],
  )

  const marked = useMemo(() => buildMarked(existingIds), [existingIds])

  const html = useMemo(() => marked.parse(note.raw) as string, [marked, note.raw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Wire wiki-link clicks
    const handleClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button[data-wiki]')
      if (!btn) return
      const target = decodeURIComponent((btn as HTMLElement).dataset.wiki ?? '')
      if (!target) return
      if (existingIds.has(target)) {
        onNavigateRef.current(target)
      } else {
        onCreateNoteRef.current(target)
      }
    }
    container.addEventListener('click', handleClick)

    linkifyTags(container, tag => {
      // filter by tag: navigate to first note with this tag
      const match = Array.from(graphNodes).find(n => n.tags.includes(tag))
      if (match) onNavigateRef.current(match.id)
    })

    return () => container.removeEventListener('click', handleClick)
  }, [html, existingIds, graphNodes])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/70 shrink-0">
        <span className="text-xs text-slate-500 font-mono">{note.filename}.md</span>
        <button
          onClick={onEdit}
          className="px-2.5 py-1 text-xs rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Rendered markdown */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          ref={containerRef}
          className="md-body fade-in"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Metadata footer */}
        {(note.tags.length > 0 || note.backlinks.length > 0) && (
          <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-3">
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {note.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {note.backlinks.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 mb-1.5">Linked from</p>
                <div className="flex flex-wrap gap-1.5">
                  {note.backlinks.map(bl => (
                    <button
                      key={bl}
                      onClick={() => onNavigate(bl)}
                      className="text-xs px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 hover:border-emerald-600/60 transition-colors"
                    >
                      {bl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
